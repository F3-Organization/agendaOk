export interface AuthUserPayload {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "USER";
    companyId?: string;
}
