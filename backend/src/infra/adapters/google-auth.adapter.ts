import { OAuth2Client } from "google-auth-library";
import { env } from "../config/configs";
import { IGoogleAuthService, GoogleUserProfile } from "../../usecase/ports/igoogle-auth-service";

export class GoogleAuthAdapter implements IGoogleAuthService {
    private client: OAuth2Client;

    constructor() {
        this.client = new OAuth2Client(
            env.google.clientId,
            env.google.clientSecret,
            env.google.redirectUri
        );
    }

    getAuthUrl(): string {
        return this.client.generateAuthUrl({
            access_type: "online",
            scope: [
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
            prompt: "select_account",
        });
    }

    async getTokens(code: string): Promise<{ access_token: string }> {
        const { tokens } = await this.client.getToken(code);
        if (!tokens.access_token) throw new Error("No access token received");
        return { access_token: tokens.access_token };
    }

    async getUserProfile(accessToken: string): Promise<GoogleUserProfile> {
        this.client.setCredentials({ access_token: accessToken });
        const res = await this.client.request<{ id: string; email: string; name: string }>({
            url: "https://www.googleapis.com/oauth2/v2/userinfo",
        });
        const data = res.data;
        return { id: data.id, email: data.email, name: data.name };
    }
}
