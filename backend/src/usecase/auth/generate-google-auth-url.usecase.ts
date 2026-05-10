import { IGoogleCalendarService } from "../ports/igoogle-calendar-service";

export class GenerateGoogleAuthUrlUseCase {
    constructor(private readonly googleService: IGoogleCalendarService) {}

    execute(): string {
        return this.googleService.getAuthUrl();
    }
}
