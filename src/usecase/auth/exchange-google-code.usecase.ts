import { IGoogleCalendarService } from "../ports/igoogle-calendar-service";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { IIntegrationRepository } from "../repositories/iintegration-repository";
import { Integration } from "../../infra/database/entities/integration.entity";

export class ExchangeGoogleCodeUseCase {
    constructor(
        private readonly googleService: IGoogleCalendarService,
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly integrationRepository: IIntegrationRepository
    ) {}

    async execute(companyId: string, tokens: any): Promise<void> {
        const expiryDate = new Date();
        if (tokens.expires_in) {
            expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);
        }

        // 1. Update/Create Integration (per company)
        let integration = await this.integrationRepository.findByCompanyAndProvider(companyId, "GOOGLE");
        if (!integration) {
            integration = new Integration();
            integration.companyId = companyId;
            integration.provider = "GOOGLE";
        }

        integration.accessToken = tokens.access_token;
        if (tokens.refresh_token) {
            integration.refreshToken = tokens.refresh_token;
        }
        integration.expiresAt = expiryDate;
        
        await this.integrationRepository.save(integration);

        // 2. Enable Sync in CompanyConfig
        let config = await this.companyConfigRepository.findByCompanyId(companyId);
        if (config) {
            config.syncEnabled = true;
            await this.companyConfigRepository.save(config);
        }
    }
}
