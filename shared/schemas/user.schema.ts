import { z } from "zod";

export const userConfigSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    email: z.string().email("E-mail inválido"),
    whatsappNumber: z.string().optional(),
    taxId: z.string().optional(),
    silentWindowStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)").optional(),
    silentWindowEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)").optional(),
    syncEnabled: z.boolean().optional(),
});

export const updateUserConfigSchema = userConfigSchema.partial();

export type UserConfigDTO = z.infer<typeof userConfigSchema>;
export type UpdateUserConfigDTO = z.infer<typeof updateUserConfigSchema>;
