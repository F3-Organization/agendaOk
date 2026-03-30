import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { GenerateGoogleAuthUrlUseCase } from "../../usecase/auth/generate-google-auth-url.usecase";
import { ExchangeGoogleCodeUseCase } from "../../usecase/auth/exchange-google-code.usecase";
import { UserRepository } from "../database/repositories/user.repository";
import { User } from "../database/entities/user.entity";
import { IGoogleCalendarService } from "../../usecase/ports/igoogle-calendar-service";
import { z } from "zod";
import * as bcrypt from "bcrypt";
import { AuthMeResponseSchema, LoginResponseSchema, LoginInputSchema, RegisterInputSchema, VerifyRegistrationInputSchema } from "../../../shared/schemas/auth.schema";
import { SendEmailVerificationUseCase } from "../../usecase/auth/send-email-verification.usecase";
import { VerifyEmailSetPasswordUseCase } from "../../usecase/auth/verify-email-set-password.usecase";
import { FastifyReply, FastifyRequest } from "fastify";
import { GoogleCalendarAdapter } from "../adapters/google-calendar.adapter";


export class AuthController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly generateAuthUrl: GenerateGoogleAuthUrlUseCase,
        private readonly exchangeCode: ExchangeGoogleCodeUseCase,
        private readonly userRepo: UserRepository,
        private readonly googleService: GoogleCalendarAdapter,
        private readonly sendEmailVerification: SendEmailVerificationUseCase,
        private readonly verifyEmailSetPassword: VerifyEmailSetPasswordUseCase
    ) {
        this.fastify.logInfo("[AuthController] Initializing...");
        this.registerRoutes();
    }


    private registerRoutes() {
        this.fastify.addRoute("GET", "/auth/google", async (request: FastifyRequest, reply: FastifyReply) => {
            const url = this.generateAuthUrl.execute();
            reply.redirect(url);
        }, {
            tags: ["Auth"],
            summary: "Starts the Google authentication flow",
            description: "Redirects the user to the Google OAuth2 consent page.",
            response: {
                302: {
                    type: 'object',
                    description: 'Redirect to Google'
                }
            }
        });

        this.fastify.addRoute("GET", "/auth/google/callback", async (request: FastifyRequest, reply: FastifyReply) => {
            const callbackSchema = z.object({
                code: z.string().min(1)
            });

            const parseResult = callbackSchema.safeParse(request.query);

            if (!parseResult.success) {
                return reply.code(400).send({
                    error: "Invalid request",
                    details: parseResult.error.format()
                });
            }

            const { code } = parseResult.data;

            try {
                const tokens = await this.googleService.getTokens(code);

                const profile = await this.googleService.getUserProfile(tokens.access_token);

                let user = await this.userRepo.findByGoogleId(profile.id);
                if (!user) {
                    user = new User();
                    user.googleId = profile.id;
                    user.email = profile.email;
                    user.name = profile.name;
                    user = await this.userRepo.save(user);
                }

                await this.exchangeCode.execute(user.id, tokens);

                const token = this.fastify.sign({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                });

                reply.send({
                    message: "Authentication successful!",
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
            } catch (error: any) {
                console.error("[AuthController] Authentication failed:", error);
                reply.code(500).send({
                    error: "Authentication failure",
                    message: error.message
                });
            }
        }, {
            tags: ["Auth"],
            summary: "Google authentication callback",
            description: "Receives the code from Google, creates/finds the user, saves tokens, and returns a JWT for future sessions.",
            querystring: {
                type: 'object',
                required: ['code'],
                properties: {
                    code: { type: 'string' }
                }
            }
        });

        // 3. Rota para pegar dados do usuário logado
        this.fastify.addProtectedRoute("GET", "/auth/me", async (request: FastifyRequest, reply: FastifyReply) => {
            const userId = (request.user as any).id;
            const user = await this.userRepo.findById(userId);

            if (!user) {
                return reply.code(404).send({ error: "User not found" });
            }

            reply.send({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            });
        }, {
            tags: ["Auth"],
            summary: "Obtém dados do usuário autenticado"
        });

        // 4. Rota de Registro Convencional

        this.fastify.addRoute("POST", "/auth/register", async (request: FastifyRequest, reply: FastifyReply) => {
            const parseResult = RegisterInputSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            const { name, email, password } = parseResult.data;

            const existingUser = await this.userRepo.findByEmail(email);

            if (existingUser) {
                // Se o usuário existir mas não tiver senha, ele veio do Google.
                // Iniciamos o fluxo de verificação de e-mail para ele definir uma senha.
                if (!existingUser.password) {
                    try {
                        await this.sendEmailVerification.execute(email);
                        return reply.send({
                            status: 'PENDING_VERIFICATION',
                            message: "Email verification code sent. Please verify your email to set a password."
                        });
                    } catch (error: any) {
                        return reply.code(500).send({ error: "Failed to send verification email", message: error.message });
                    }
                }

                return reply.code(400).send({ error: "User already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            let user = new User();
            user.name = name;
            user.email = email;
            user.password = hashedPassword;

            user = await this.userRepo.save(user);

            const token = this.fastify.sign({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            });

            reply.send({
                message: "Registration successful",
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });
        }, {
            tags: ["Auth"],
            summary: "Registers a new user or starts verification for existing Google users"
        });

        // 4.1. Rota de Verificação de Registro (para quem já existe via Google)
        this.fastify.addRoute("POST", "/auth/register/verify", async (request: FastifyRequest, reply: FastifyReply) => {
            const parseResult = VerifyRegistrationInputSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            const { email, code, password } = parseResult.data;

            try {
                const user = await this.verifyEmailSetPassword.execute(email, code, password);

                const token = this.fastify.sign({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                });

                reply.send({
                    message: "Email verified and password set successfully",
                    token,
                    user: { id: user.id, name: user.name, email: user.email, role: user.role }
                });
            } catch (error: any) {
                return reply.code(400).send({ error: "Verification failed", message: error.message });
            }
        }, {
            tags: ["Auth"],
            summary: "Verifies email and sets password for existing Google users"
        });


        this.fastify.addRoute("POST", "/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
            const parseResult = LoginInputSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            const { email, password } = parseResult.data;

            const user = await this.userRepo.findByEmail(email);
            if (!user || !user.password) {
                return reply.code(401).send({ error: "Invalid credentials" });
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return reply.code(401).send({ error: "Invalid credentials" });
            }

            const token = this.fastify.sign({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            });

            reply.send({
                message: "Login successful",
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });
        }, {
            tags: ["Auth"],
            summary: "Logins a user with email and password"
        });
    }
}

