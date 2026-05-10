import { errorResponse, authResponseProperties, messageResponse } from "./_common.swagger";

export const googleAuthSchema = {
    tags: ["Auth"],
    summary: "Starts the Google authentication flow",
    description: "Redirects the user to the Google OAuth2 consent page.",
    response: {
        302: { type: "object" as const, description: "Redirect to Google" }
    }
};

export const googleCallbackSchema = {
    tags: ["Auth"],
    summary: "Google authentication callback",
    description: "Receives the code from Google, creates/finds the user, saves tokens, and returns a JWT.",
    querystring: {
        type: "object" as const,
        required: ["code"],
        properties: {
            code: { type: "string" as const }
        }
    },
    response: {
        200: { type: "object" as const, properties: authResponseProperties },
        500: errorResponse("Authentication failure")
    }
};

export const authMeSchema = {
    tags: ["Auth"],
    summary: "Obtém dados do usuário autenticado",
    description: "Retorna o perfil do usuário logado baseado no token JWT.",
    response: {
        200: {
            type: "object" as const,
            properties: {
                id: { type: "string" as const, format: "uuid" },
                name: { type: "string" as const },
                email: { type: "string" as const },
                role: { type: "string" as const },
                companyId: { type: "string" as const, nullable: true },
                hasPassword: { type: "boolean" as const },
                config: {
                    type: "object" as const,
                    nullable: true,
                    properties: {
                        whatsappNumber: { type: "string" as const, nullable: true },
                        taxId: { type: "string" as const, nullable: true },
                        syncEnabled: { type: "boolean" as const },
                        silentWindowStart: { type: "string" as const },
                        silentWindowEnd: { type: "string" as const }
                    }
                }
            }
        },
        401: errorResponse("Unauthorized")
    }
};

export const registerSchema = {
    tags: ["Auth"],
    summary: "Registers a new user or starts verification for existing Google users",
    description: "Creates a new account. If user exists but only has Google login, sends a verification code to set password.",
    body: {
        type: "object" as const,
        required: ["name", "email", "password", "whatsappNumber"],
        properties: {
            name: { type: "string" as const },
            email: { type: "string" as const, format: "email" },
            password: { type: "string" as const, minLength: 6 },
            whatsappNumber: { type: "string" as const }
        }
    },
    response: {
        200: { type: "object" as const, properties: authResponseProperties },
        400: errorResponse("Registration failed")
    }
};

export const registerVerifySchema = {
    tags: ["Auth"],
    summary: "Verifies email and sets password for existing Google users",
    description: "Finalizes password setup for Google-authenticated users who want to add email/password login.",
    body: {
        type: "object" as const,
        required: ["email", "code", "password"],
        properties: {
            email: { type: "string" as const, format: "email" },
            code: { type: "string" as const },
            password: { type: "string" as const }
        }
    },
    response: {
        200: { type: "object" as const, properties: authResponseProperties },
        400: errorResponse("Verification failed")
    }
};

export const loginSchema = {
    tags: ["Auth"],
    summary: "Logins a user with email and password",
    description: "Authenticates the user and returns a JWT access token.",
    body: {
        type: "object" as const,
        required: ["email", "password"],
        properties: {
            email: { type: "string" as const, format: "email" },
            password: { type: "string" as const }
        }
    },
    response: {
        200: { type: "object" as const, properties: authResponseProperties },
        401: { type: "object" as const, properties: { error: { type: "string" as const } } }
    }
};

export const authConfigSchema = {
    tags: ["Auth"],
    summary: "Update user configuration",
    description: "Updates the user's configuration, such as WhatsApp number and sync settings.",
    body: {
        type: "object" as const,
        properties: {
            whatsappNumber: { type: "string" as const },
            taxId: { type: "string" as const },
            syncEnabled: { type: "boolean" as const },
            silentWindowStart: { type: "string" as const },
            silentWindowEnd: { type: "string" as const },
            name: { type: "string" as const },
            email: { type: "string" as const, format: "email" }
        }
    },
    response: {
        200: messageResponse,
        400: errorResponse("Bad request")
    }
};

export const login2FAVerifySchema = {
    tags: ["Auth"],
    summary: "Verifies 2FA code during login",
    description: "Takes a temporary token and a 2FA code to complete the authentication process.",
    body: {
        type: "object" as const,
        required: ["tempToken", "code"],
        properties: {
            tempToken: { type: "string" as const },
            code: { type: "string" as const, minLength: 6, maxLength: 6 }
        }
    },
    response: {
        200: { type: "object" as const, properties: authResponseProperties },
        401: { type: "object" as const, properties: { error: { type: "string" as const } } }
    }
};
