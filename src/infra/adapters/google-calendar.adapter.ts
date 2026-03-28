import { IGoogleCalendarService } from "../../usecase/ports/igoogle-calendar-service";
import { env } from "../config/configs";

export class GoogleCalendarAdapter implements IGoogleCalendarService {
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly redirectUri: string;

    constructor() {
        this.clientId = env.google.clientId;
        this.clientSecret = env.google.clientSecret;
        this.redirectUri = env.google.redirectUri;
    }

    getAuthUrl(): string {
        const scopes = [
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/userinfo.email"
        ].join(" ");

        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: "code",
            scope: scopes,
            access_type: "offline",
            prompt: "consent"
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    async getTokens(code: string): Promise<any> {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: this.redirectUri,
                grant_type: "authorization_code"
            }).toString()
        });

        if (!response.ok) {
            throw new Error(`Google Token Error: ${await response.text()}`);
        }

        return await response.json();
    }

    async refreshAccessToken(refreshToken: string): Promise<any> {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token"
            }).toString()
        });

        if (!response.ok) {
            throw new Error(`Google Refresh Token Error: ${await response.text()}`);
        }

        return await response.json();
    }

    async listEvents(accessToken: string, timeMin: Date, timeMax: Date): Promise<any[]> {
        const params = new URLSearchParams({
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: "true",
            orderBy: "startTime"
        });

        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            throw new Error(`Google List Events Error: ${await response.text()}`);
        }

        const data = await response.json() as any;
        return data.items || [];
    }

    async updateEvent(accessToken: string, eventId: string, updates: Partial<any>): Promise<void> {
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            throw new Error(`Google Update Event Error: ${await response.text()}`);
        }
    }
}
