import { z } from "zod";

export const userConfigSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    email: z.email("E-mail inválido"),
    whatsappNumber: z.string().optional(),
    taxId: z.string().optional(),
    silentWindowStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)").optional(),
    silentWindowEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)").optional(),
    syncEnabled: z.boolean().optional(),
    twoFactorEnabled: z.boolean().optional(),
    hasPassword: z.boolean().optional(),
});

export const updateUserConfigSchema = userConfigSchema.partial();

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirmação de senha é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

export const setPasswordSchema = z.object({
    newPassword: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirmação de senha é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

export const toggle2FASchema = z.object({
    enabled: z.boolean(),
});

export const verify2FASchema = z.object({
    token: z.string().length(6, "Token deve ter 6 dígitos"),
});

export type UserConfigDTO = z.infer<typeof userConfigSchema>;
export type UpdateUserConfigDTO = z.infer<typeof updateUserConfigSchema>;
export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;
export type SetPasswordDTO = z.infer<typeof setPasswordSchema>;
export type Toggle2FADTO = z.infer<typeof toggle2FASchema>;
export type Verify2FADTO = z.infer<typeof verify2FASchema>;
