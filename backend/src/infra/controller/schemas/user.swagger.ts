import { errorResponse, messageResponse } from "./_common.swagger";

export const getUserConfigSchema = {
    tags: ["User"],
    summary: "Obtém configurações do usuário",
    description: "Retorna nome, email, configurações da empresa e status de 2FA.",
    response: {
        200: {
            type: "object" as const,
            properties: {
                name: { type: "string" as const },
                email: { type: "string" as const },
                whatsappNumber: { type: "string" as const, nullable: true },
                taxId: { type: "string" as const, nullable: true },
                silentWindowStart: { type: "string" as const, nullable: true },
                silentWindowEnd: { type: "string" as const, nullable: true },
                twoFactorEnabled: { type: "boolean" as const },
                hasPassword: { type: "boolean" as const }
            }
        }
    }
};

export const updateUserConfigSwaggerSchema = {
    tags: ["User"],
    summary: "Atualiza configurações do usuário",
    description: "Atualiza parcialmente nome, email, WhatsApp, janela de silêncio, etc.",
    body: {
        type: "object" as const,
        properties: {
            name: { type: "string" as const },
            email: { type: "string" as const, format: "email" },
            whatsappNumber: { type: "string" as const },
            taxId: { type: "string" as const },
            silentWindowStart: { type: "string" as const, pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$" },
            silentWindowEnd: { type: "string" as const, pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$" }
        }
    },
    response: {
        200: messageResponse,
        400: errorResponse("No company found or validation failed")
    }
};

export const changePasswordSwaggerSchema = {
    tags: ["User"],
    summary: "Altera a senha do usuário",
    description: "Requer a senha atual e define uma nova senha.",
    body: {
        type: "object" as const,
        required: ["currentPassword", "newPassword", "confirmPassword"],
        properties: {
            currentPassword: { type: "string" as const },
            newPassword: { type: "string" as const, minLength: 6 },
            confirmPassword: { type: "string" as const, minLength: 6 }
        }
    },
    response: {
        200: messageResponse,
        400: errorResponse("Senha incorreta ou não coincide")
    }
};

export const setPasswordSwaggerSchema = {
    tags: ["User"],
    summary: "Define senha para usuário Google-only",
    description: "Permite que um usuário que fez login apenas pelo Google defina uma senha local.",
    body: {
        type: "object" as const,
        required: ["newPassword", "confirmPassword"],
        properties: {
            newPassword: { type: "string" as const, minLength: 6 },
            confirmPassword: { type: "string" as const, minLength: 6 }
        }
    },
    response: {
        200: messageResponse,
        400: errorResponse("Validation failed")
    }
};

export const toggle2FASwaggerSchema = {
    tags: ["User"],
    summary: "Ativa ou desativa autenticação de dois fatores",
    description: "Quando ativado, retorna o secret e otpauthUrl para configurar no app autenticador.",
    body: {
        type: "object" as const,
        required: ["enabled"],
        properties: {
            enabled: { type: "boolean" as const }
        }
    },
    response: {
        200: {
            type: "object" as const,
            properties: {
                message: { type: "string" as const },
                secret: { type: "string" as const },
                otpauthUrl: { type: "string" as const }
            }
        }
    }
};

export const verify2FASwaggerSchema = {
    tags: ["User"],
    summary: "Verifica token 2FA para confirmar ativação",
    description: "Valida o código TOTP gerado pelo app autenticador para finalizar a ativação do 2FA.",
    body: {
        type: "object" as const,
        required: ["token"],
        properties: {
            token: { type: "string" as const, minLength: 6, maxLength: 6 }
        }
    },
    response: {
        204: { type: "null" as const, description: "2FA verified successfully" }
    }
};
