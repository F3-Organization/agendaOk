import { z } from "zod";

export const AuthUserSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    role: z.enum(["ADMIN", "USER"]),
    config: z.object({
        whatsappNumber: z.string().nullable(),
        syncEnabled: z.boolean(),
        silentWindowStart: z.string(),
        silentWindowEnd: z.string()
    }).nullable()
});

export const LoginResponseSchema = z.object({
    message: z.string(),
    token: z.string().optional(),
    user: AuthUserSchema.optional(),
    status: z.string().optional(),
    tempToken: z.string().optional()
});

export const AuthMeResponseSchema = AuthUserSchema;

export const LoginInputSchema = z.object({
    email: z.email(),
    password: z.string().min(6)
});

export const RegisterInputSchema = z.object({
    name: z.string().min(2),
    email: z.email(),
    password: z.string().min(6),
    whatsappNumber: z.string().min(10).describe("WhatsApp number with DDD")
});

export const VerifyRegistrationInputSchema = z.object({
    email: z.email(),
    code: z.string().length(6),
    password: z.string().min(6)
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type VerifyRegistrationInput = z.infer<typeof VerifyRegistrationInputSchema>;

