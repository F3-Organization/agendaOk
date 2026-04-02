import { FastifyReply, FastifyRequest } from "fastify";
import { IUserConfigRepository } from "../../usecase/repositories/iuser-config-repository";
import { IUserRepository } from "../../usecase/repositories/iuser-repository";
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
import { z } from "zod";
import { 
    LoginInputSchema, 
    RegisterInputSchema, 
    VerifyRegistrationInputSchema 
} from "../../../shared/schemas/auth.schema";

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
        private readonly userConfigRepo: IUserConfigRepository
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
                    type: "object",
                    description: "Redirect to Google"
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
                const { user } = await this.authenticateGoogle.execute(code);

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
                this.fastify.logInfo("[AuthController] Authentication failed:", { error: error.message });
                reply.code(500).send({
                    error: "Authentication failure",
                    message: error.message
                });
            }
        }, {
            tags: ["Auth"],
            summary: "Google authentication callback",
            description: "Receives the code from Google, creates/finds the user, saves tokens, and returns a JWT.",
            querystring: {
                type: "object",
                required: ["code"],
                properties: {
                    code: { type: "string" }
                }
            }
        });

        this.fastify.addProtectedRoute("GET", "/auth/me", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const fullUser = await this.userRepo.findById(user.id);
            const config = await this.userConfigRepo.findByUserId(user.id);
            
            reply.send({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                config: config ? {
                    whatsappNumber: config.whatsappNumber,
                    syncEnabled: config.syncEnabled,
                    silentWindowStart: config.silentWindowStart,
                    silentWindowEnd: config.silentWindowEnd
                } : null,
                hasPassword: !!fullUser?.password
            });
        }, {
            tags: ["Auth"],
            summary: "Obtém dados do usuário autenticado",
            description: "Retorna o perfil do usuário logado baseado no token JWT.",
            response: {
                200: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        email: { type: "string" },
                        role: { type: "string" },
                        hasPassword: { type: "boolean" },
                        config: {
                            type: "object",
                            nullable: true,
                            properties: {
                                whatsappNumber: { type: "string", nullable: true },
                                syncEnabled: { type: "boolean" },
                                silentWindowStart: { type: "string" },
                                silentWindowEnd: { type: "string" }
                            }
                        }
                    }
                },
                401: {
                    type: "object",
                    properties: {
                        error: { type: "string" },
                        message: { type: "string" }
                    }
                }
            }
        });


        this.fastify.addRoute("POST", "/auth/register", async (request: FastifyRequest, reply: FastifyReply) => {
            const parseResult = RegisterInputSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            const { name, email, password, whatsappNumber } = parseResult.data;

            try {
                const user = await this.registerUser.execute({ name, email, password, whatsappNumber });

                const token = this.fastify.sign({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                });

                reply.send({
                    message: "Registration successful",
                    token,
                    user: { 
                        id: user.id, 
                        name: user.name, 
                        email: user.email, 
                        role: user.role,
                        hasPassword: !!user.password
                    }
                });
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
        }, {
            tags: ["Auth"],
            summary: "Registers a new user or starts verification for existing Google users",
            description: "Creates a new account. If user exists but only has Google login, sends a verification code to set password.",
            body: {
                type: "object",
                required: ["name", "email", "password", "whatsappNumber"],
                properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6 },
                    whatsappNumber: { type: "string" }
                }
            },
            response: {
                200: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                        token: { type: "string" },
                        user: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string" },
                                role: { type: "string" }
                            }
                        },
                        status: { type: "string" }
                    }
                },
                400: {
                    type: "object",
                    properties: {
                        error: { type: "string" },
                        message: { type: "string" }
                    }
                }
            }
        });


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
                    user: { 
                        id: user.id, 
                        name: user.name, 
                        email: user.email, 
                        role: user.role,
                        hasPassword: !!user.password
                    }
                });
            } catch (error: any) {
                return reply.code(400).send({ error: "Verification failed", message: error.message });
            }
        }, {
            tags: ["Auth"],
            summary: "Verifies email and sets password for existing Google users",
            description: "Finalizes password setup for Google-authenticated users who want to add email/password login.",
            body: {
                type: "object",
                required: ["email", "code", "password"],
                properties: {
                    email: { type: "string", format: "email" },
                    code: { type: "string" },
                    password: { type: "string" }
                }
            },
            response: {
                200: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                        token: { type: "string" },
                        user: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string" },
                                role: { type: "string" }
                            }
                        }
                    }
                },
                400: {
                    type: "object",
                    properties: {
                        error: { type: "string" },
                        message: { type: "string" }
                    }
                }
            }
        });


        this.fastify.addRoute("POST", "/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
            const parseResult = LoginInputSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            const { email, password } = parseResult.data;

            try {
                const user = await this.login.execute(email, password);

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

                const token = this.fastify.sign({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                });

                reply.send({
                    message: "Login successful",
                    token,
                    user: { 
                        id: user.id, 
                        name: user.name, 
                        email: user.email, 
                        role: user.role,
                        hasPassword: !!user.password
                    }
                });
            } catch (error: any) {
                return reply.code(401).send({ error: "Invalid credentials" });
            }
        }, {
            tags: ["Auth"],
            summary: "Logins a user with email and password",
            description: "Authenticates the user and returns a JWT access token.",
            body: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" }
                }
            },
            response: {
                200: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                        token: { type: "string" },
                        user: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string" },
                                role: { type: "string" }
                            }
                        }
                    }
                },
                401: {
                    type: "object",
                    properties: {
                        error: { type: "string" }
                    }
                }
            }
        });

        this.fastify.addProtectedRoute("PATCH", "/auth/config", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const schema = z.object({
                whatsappNumber: z.string().optional(),
                syncEnabled: z.boolean().optional(),
                silentWindowStart: z.string().optional(),
                silentWindowEnd: z.string().optional()
            });

            const parseResult = schema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            try {
                await this.updateUserConfig.execute(user.id, parseResult.data);
                reply.send({ message: "Configuration updated successfully" });
            } catch (error: any) {
                reply.code(500).send({ error: "Failed to update configuration", message: error.message });
            }
        }, {
            tags: ["Auth"],
            summary: "Update user configuration",
            description: "Updates the user's configuration, such as WhatsApp number and sync settings.",
            body: {
                type: "object",
                properties: {
                    whatsappNumber: { type: "string" },
                    syncEnabled: { type: "boolean" },
                    silentWindowStart: { type: "string" },
                    silentWindowEnd: { type: "string" }
                }
            },
            response: {
                200: {
                    type: "object",
                    properties: {
                        message: { type: "string" }
                    }
                }
            }
        });

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

                const token = this.fastify.sign({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
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
                    }
                });
            } catch (error: any) {
                this.fastify.logInfo("[AuthController] 2FA verification failed:", { error: error.message });
                reply.code(401).send({ error: error.message });
            }
        }, {
            tags: ["Auth"],
            summary: "Verifies 2FA code during login",
            description: "Takes a temporary token and a 2FA code to complete the authentication process.",
            body: {
                type: "object",
                required: ["tempToken", "code"],
                properties: {
                    tempToken: { type: "string" },
                    code: { type: "string", minLength: 6, maxLength: 6 }
                }
            }
        });

    }
}
