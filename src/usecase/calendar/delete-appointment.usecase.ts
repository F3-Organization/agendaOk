import { IGoogleCalendarService } from "../ports/igoogle-calendar-service";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { IIntegrationRepository } from "../repositories/iintegration-repository";

export class DeleteAppointmentUseCase {
    constructor(
        private readonly googleService: IGoogleCalendarService,
        private readonly scheduleRepository: IScheduleRepository,
        private readonly userConfigRepository: IUserConfigRepository,
        private readonly integrationRepository: IIntegrationRepository
    ) {}

    async execute(id: string, userId: string): Promise<void> {
        const schedule = await this.scheduleRepository.findById(id, userId);
        if (!schedule) {
            return; // Idempotent operacao
        }

        const config = await this.userConfigRepository.findByUserId(userId);
        const integration = await this.integrationRepository.findByUserAndProvider(userId, "GOOGLE");
        
        if (!config || !integration || !integration.refreshToken) {
            throw new Error("Usuário não possui conexão ativa com o Google Calendar.");
        }

        let accessToken = integration.accessToken;

        if (this.isTokenExpired(integration.expiresAt)) {
            const tokens = await this.googleService.refreshAccessToken(integration.refreshToken);
            
            const newAccessToken = tokens.access_token as string;
            if (!newAccessToken) {
                throw new Error("Falha ao atualizar o token de acesso do Google.");
            }
            
            accessToken = newAccessToken;

            const expiryDate = new Date();
            if (tokens.expires_in) {
                expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);
            }

            await this.integrationRepository.save({
                id: integration.id,
                accessToken: newAccessToken,
                expiresAt: expiryDate
            });
        }

        if (!accessToken) {
            throw new Error("Token de acesso do Google indisponível.");
        }

        try {
            await this.googleService.deleteEvent(accessToken, schedule.googleEventId);
        } catch (err: any) {
            console.error(`[DeleteAppointmentUseCase] Erro ao deletar no Google: ${err.message}`);
        }

        await this.scheduleRepository.delete(id, userId);
    }

    private isTokenExpired(expiry?: Date | null): boolean {
        if (!expiry) return true;
        const now = new Date();
        return now.getTime() >= (expiry.getTime() - 300000); // 5 minutes margin
    }
}
