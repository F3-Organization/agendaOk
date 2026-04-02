import { IGoogleCalendarService } from "../ports/igoogle-calendar-service";
import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { IIntegrationRepository } from "../repositories/iintegration-repository";
import { Integration } from "../../infra/database/entities/integration.entity";

export class ExchangeGoogleCodeUseCase {
    constructor(
        private readonly googleService: IGoogleCalendarService,
        private readonly userConfigRepository: IUserConfigRepository,
        private readonly integrationRepository: IIntegrationRepository
    ) {}

    async execute(userId: string, tokens: any): Promise<void> {
        const expiryDate = new Date();
        if (tokens.expires_in) {
            expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);
        }

        // 1. Update/Create Integration
        let integration = await this.integrationRepository.findByUserAndProvider(userId, "GOOGLE");
        if (!integration) {
            integration = new Integration();
            integration.userId = userId;
            integration.provider = "GOOGLE";
        }

        integration.accessToken = tokens.access_token;
        if (tokens.refresh_token) {
            integration.refreshToken = tokens.refresh_token;
        }
        integration.expiresAt = expiryDate;
        
        await this.integrationRepository.save(integration);

        // 2. Enable Sync in UserConfig
        let config = await this.userConfigRepository.findByUserId(userId);
        if (config) {
            config.syncEnabled = true;
            await this.userConfigRepository.save(config);
        }
    }
}
