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

export type AuthUser = z.infer<typeof AuthUserSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;
