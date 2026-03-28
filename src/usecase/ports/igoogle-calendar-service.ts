export interface IGoogleCalendarService {
    getAuthUrl(): string;
    getTokens(code: string): Promise<any>;
    refreshAccessToken(refreshToken: string): Promise<any>;
    listEvents(accessToken: string, timeMin: Date, timeMax: Date): Promise<any[]>;
    updateEvent(accessToken: string, eventId: string, updates: Partial<any>): Promise<void>;
}
