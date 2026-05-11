import { FastifyReply, FastifyRequest } from "fastify";
import { ICompanyConfigRepository } from "../../usecase/repositories/icompany-config-repository";
import { ICompanyRepository } from "../../usecase/repositories/icompany-repository";
import { IUserRepository } from "../../usecase/repositories/iuser-repository";
import { IProfessionalRepository } from "../../usecase/repositories/iprofessional-repository";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { GenerateGoogleAuthUrlUseCase } from "../../usecase/auth/generate-google-auth-url.usecase";
import { AuthenticateGoogleUseCase } from "../../usecase/auth/authenticate-google.usecase";
import { RegisterUserUseCase } from "../../usecase/auth/register-user.usecase";
import { LoginUseCase } from "../../usecase/auth/login.usecase";
import { SendEmailVerificationUseCase } from "../../usecase/auth/send-email-verification.usecase";
import { VerifyEmailSetPasswordUseCase } from "../../usecase/auth/verify-email-set-password.usecase";
import { UpdateUserConfigUseCase } from "../../usecase/user/update-user-config.usecase";
import { Validate2FAUseCase } from "../../usecase/user/validate-2fa.usecase";
import { LoginVerify2FAUseCase } from "../../usecase/auth/login-verify-2fa.usecase";
import { AuthUserPayload } from "../types/auth.types";
import { User } from "../database/entities/user.entity";
import { z } from "zod";
import { 
    LoginInputSchema, 
    RegisterInputSchema, 
    VerifyRegistrationInputSchema 
} from "../../../../shared/schemas/auth.schema";
import {
    googleAuthSchema,
    googleCallbackSchema,
    authMeSchema,
    registerSchema,
    registerVerifySchema,
    loginSchema,
    authConfigSchema,
    login2FAVerifySchema
} from "./schemas/auth.swagger";

export class AuthController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly generateAuthUrl: GenerateGoogleAuthUrlUseCase,
        private readonly authenticateGoogle: AuthenticateGoogleUseCase,
        private readonly registerUser: RegisterUserUseCase,
        private readonly login: LoginUseCase,
        private readonly validate2FA: Validate2FAUseCase,
        private readonly loginVerify2FA: LoginVerify2FAUseCase,
        private readonly sendEmailVerification: SendEmailVerificationUseCase,
        private readonly verifyEmailSetPassword: VerifyEmailSetPasswordUseCase,
        private readonly updateUserConfig: UpdateUserConfigUseCase,
        private readonly userRepo: IUserRepository,
        private readonly companyRepo: ICompanyRepository,
        private readonly companyConfigRepo: ICompanyConfigRepository,
        private readonly professionalRepo: IProfessionalRepository
    ) {
        this.fastify.logInfo("[AuthController] Initializing...");
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.addRoute("GET", "/auth/google", async (request: FastifyRequest, reply: FastifyReply) => {
            const url = this.generateAuthUrl.execute();
            reply.redirect(url);
        }, googleAuthSchema);

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
                const { user, companyId } = await this.authenticateGoogle.execute(code);
                return this.sendAuthResponse(reply, user, "Authentication successful!", companyId ?? undefined);
            } catch (error: any) {
                this.fastify.logInfo("[AuthController] Authentication failed:", { error: error.message });
                reply.code(500).send({
                    error: "Authentication failure",
                    message: error.message
                });
            }
        }, googleCallbackSchema);

        this.fastify.addProtectedRoute("GET", "/auth/me", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const fullUser = await this.userRepo.findById(user.id);

            // Resolve company config from JWT companyId or user's first company
            let companyId = user.companyId;
            if (!companyId) {
                const companies = await this.companyRepo.findByOwnerId(user.id);
                companyId = companies[0]?.id;
            }
            const config = companyId ? await this.companyConfigRepo.findByCompanyId(companyId) : null;
            
            reply.send({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: companyId || null,
                config: config ? {
                    whatsappNumber: config.whatsappNumber,
                    taxId: config.taxId,
                    silentWindowStart: config.silentWindowStart,
                    silentWindowEnd: config.silentWindowEnd
                } : null,
                hasPassword: !!fullUser?.password
            });
        }, authMeSchema);


        this.fastify.addRoute("POST", "/auth/register", async (request: FastifyRequest, reply: FastifyReply) => {
            const parseResult = RegisterInputSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            const { name, email, password, whatsappNumber } = parseResult.data;

            try {
                const user = await this.registerUser.execute({ name, email, password, whatsappNumber });
                return this.sendAuthResponse(reply, user, "Registration successful");
            } catch (error: any) {
                if (error.message === "User already exists") {
                    // Try to send verification email for users without password (Google-only users)
                    try {
                        await this.sendEmailVerification.execute(email);
                        return reply.send({
                            status: "PENDING_VERIFICATION",
                            message: "Email verification code sent. Please verify your email to set a password."
                        });
                    } catch (mailError: any) {
                        return reply.code(500).send({ error: "Failed to send verification email", message: mailError.message });
                    }
                }
                return reply.code(400).send({ error: "Registration failed", message: error.message });
            }
        }, registerSchema);


        this.fastify.addRoute("POST", "/auth/register/verify", async (request: FastifyRequest, reply: FastifyReply) => {
            const parseResult = VerifyRegistrationInputSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            const { email, code, password } = parseResult.data;

            try {
                const user = await this.verifyEmailSetPassword.execute(email, code, password);
                return this.sendAuthResponse(reply, user, "Email verified and password set successfully");
            } catch (error: any) {
                return reply.code(400).send({ error: "Verification failed", message: error.message });
            }
        }, registerVerifySchema);


        this.fastify.addRoute("POST", "/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
            const parseResult = LoginInputSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            const { email, password } = parseResult.data;

            try {
                const user = await this.login.execute(email, password);
                return this.sendAuthResponse(reply, user, "Login successful");
            } catch (error: any) {
                return reply.code(401).send({ error: "Invalid credentials" });
            }
        }, loginSchema);

        this.fastify.addProtectedRoute("PATCH", "/auth/config", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const schema = z.object({
                whatsappNumber: z.string().optional(),
                taxId: z.string().optional(),
                silentWindowStart: z.string().optional(),
                silentWindowEnd: z.string().optional(),
                name: z.string().optional(),
                email: z.string().email().optional()
            });

            const parseResult = schema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            try {
                // Resolve real companyId — never fallback to userId
                let companyId = user.companyId;
                if (!companyId) {
                    const companies = await this.companyRepo.findByOwnerId(user.id);
                    companyId = companies[0]?.id;
                }
                if (!companyId) {
                    return reply.code(400).send({ error: "No company found for user. Please re-login." });
                }
                await this.updateUserConfig.execute(user.id, companyId, parseResult.data);
                reply.send({ message: "Configuration updated successfully" });
            } catch (error: any) {
                reply.code(500).send({ error: "Failed to update configuration", message: error.message });
            }
        }, authConfigSchema);

        this.fastify.addRoute("POST", "/auth/2fa/login/verify", async (request: FastifyRequest, reply: FastifyReply) => {
            const schema = z.object({
                tempToken: z.string(),
                code: z.string().length(6)
            });

            const parseResult = schema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            const { tempToken, code } = parseResult.data;

            try {
                const user = await this.loginVerify2FA.execute(tempToken, code);
                const companies = await this.companyRepo.findByOwnerId(user.id);
                const resolvedCompanyId = companies[0]?.id;

                const token = this.fastify.sign({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    companyId: resolvedCompanyId || undefined
                });

                reply.send({
                    message: "2FA verification successful",
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        hasPassword: !!user.password
                    },
                    companies: companies.map(c => ({
                        id: c.id,
                        name: c.name,
                    }))
                });
            } catch (error: any) {
                this.fastify.logInfo("[AuthController] 2FA verification failed:", { error: error.message });
                reply.code(401).send({ error: error.message });
            }
        }, login2FAVerifySchema);
    }

    private async sendAuthResponse(reply: FastifyReply, user: User, message: string, companyId?: string) {
        if (user.twoFactorEnabled) {
            const tempToken = this.fastify.sign({
                id: user.id,
                is2FAPending: true
            }, { expiresIn: "5m" });

            return reply.send({
                status: "2FA_REQUIRED",
                message: "Two-Factor Authentication required",
                tempToken
            });
        }

        // PROFESSIONAL: auto-resolve company and professional from linked record
        if (user.role === "PROFESSIONAL") {
            let professional = await this.professionalRepo.findByUserId(user.id);

            // First login: link userId permanently using the invited email
            if (!professional) {
                professional = await this.professionalRepo.findByInvitedEmail(user.email);
                if (professional) {
                    await this.professionalRepo.update(professional.id, professional.companyId, { userId: user.id });
                    professional.userId = user.id;
                }
            }

            if (!professional) {
                return reply.code(403).send({ error: "Conta profissional não vinculada a nenhum profissional." });
            }

            const token = this.fastify.sign({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                companyId: professional.companyId,
                professionalId: professional.id,
            });

            return reply.send({
                message,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    hasPassword: !!user.password,
                    companyId: professional.companyId,
                    professionalId: professional.id,
                },
                companies: [],
            });
        }

        // Regular USER / ADMIN
        const companies = await this.companyRepo.findByOwnerId(user.id);
        const resolvedCompanyId = companyId || companies[0]?.id;

        const token = this.fastify.sign({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: resolvedCompanyId || undefined
        });

        return reply.send({
            message,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                hasPassword: !!user.password,
                companyId: resolvedCompanyId || undefined
            },
            companies: companies.map(c => ({
                id: c.id,
                name: c.name,
            }))
        });
    }
}
