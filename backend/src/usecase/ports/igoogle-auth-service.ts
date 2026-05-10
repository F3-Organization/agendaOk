export interface GoogleUserProfile {
    id: string;
    email: string;
    name: string;
}

export interface IGoogleAuthService {
    getAuthUrl(): string;
    getTokens(code: string): Promise<{ access_token: string }>;
    getUserProfile(accessToken: string): Promise<GoogleUserProfile>;
}
