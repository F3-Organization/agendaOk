export interface AuthUserPayload {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "USER" | "PROFESSIONAL" | "ATTENDANT";
    companyId?: string;
    professionalId?: string;
}
