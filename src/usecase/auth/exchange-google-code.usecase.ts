import { IGoogleCalendarService } from "../ports/igoogle-calendar-service";
import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { UserConfig } from "../../infra/database/entities/user-config.entity";

export class ExchangeGoogleCodeUseCase {
    constructor(
        private readonly googleService: IGoogleCalendarService,
        private readonly userConfigRepository: IUserConfigRepository
    ) {}

    async execute(userId: string, code: string): Promise<void> {
        // 1. Trocar o código pelos tokens
        const tokens = await this.googleService.getTokens(code);

        // 2. Calcular a expiração (expires_in vem em segundos)
        const expiryDate = new Date();
        if (tokens.expires_in) {
            expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);
        }

        // 3. Buscar configuração existente ou preparar nova
        let config = await this.userConfigRepository.findByUserId(userId);

        if (!config) {
            config = new UserConfig();
            config.userId = userId;
        }

        // 4. Atualizar os dados do Google
        config.googleAccessToken = tokens.access_token;
        
        // Google só envia o refresh_token na primeira autorização (ou se prompt=consent)
        if (tokens.refresh_token) {
            config.googleRefreshToken = tokens.refresh_token;
        }
        
        config.googleTokenExpiry = expiryDate;
        config.syncEnabled = true;

        // 5. Persistir
        await this.userConfigRepository.save(config);
    }
}
