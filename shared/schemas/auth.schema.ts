import { z } from "zod";

export const AuthUserSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(["ADMIN", "USER"])
});

export const LoginResponseSchema = z.object({
    message: z.string(),
    token: z.string(),
    user: AuthUserSchema
});

export const AuthMeResponseSchema = AuthUserSchema;

export const LoginInputSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

export const RegisterInputSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6)
});

export const VerifyRegistrationInputSchema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
    password: z.string().min(6)
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type VerifyRegistrationInput = z.infer<typeof VerifyRegistrationInputSchema>;

