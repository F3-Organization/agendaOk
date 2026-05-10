import { IGoogleAuthService } from "../ports/igoogle-auth-service";

export class GenerateGoogleAuthUrlUseCase {
    constructor(private readonly googleService: IGoogleAuthService) {}

    execute(): string {
        return this.googleService.getAuthUrl();
    }
}
