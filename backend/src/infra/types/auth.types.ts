export interface AuthUserPayload {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "USER" | "PROFESSIONAL";
    companyId?: string;
    professionalId?: string;
}
