import { IGoogleCalendarService } from "../ports/igoogle-calendar-service";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { IIntegrationRepository } from "../repositories/iintegration-repository";
import { ScheduleStatus } from "../../infra/database/entities/schedule.entity";

export class ConfirmAppointmentUseCase {
    constructor(
        private readonly scheduleRepository: IScheduleRepository,
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly integrationRepository: IIntegrationRepository,
        private readonly googleService: IGoogleCalendarService
    ) {}

    async execute(companyId: string, phoneNumber: string): Promise<void> {
        const now = new Date();
        const next7Days = new Date();
        next7Days.setDate(now.getDate() + 7);

        const schedules = await this.scheduleRepository.findNextToNotify(companyId, now, next7Days);

        for (const schedule of schedules) {
            const extractedPhone = this.extractPhoneNumber(`${schedule.title} ${schedule.description || ""}`);
            
            if (extractedPhone === phoneNumber) {
                // 1. Atualiza no Banco
                await this.scheduleRepository.updateStatus(schedule.id, companyId, ScheduleStatus.CONFIRMED);

                // 2. Tenta atualizar no Google
                await this.updateGoogleEvent(companyId, schedule.googleEventId, schedule.title);
                
                return; // Confirmamos o primeiro que encontramos (o mais próximo)
            }
        }
    }

    private async updateGoogleEvent(companyId: string, eventId: string, currentTitle: string) {
        const integration = await this.integrationRepository.findByCompanyAndProvider(companyId, "GOOGLE");
        if (!integration || !integration.accessToken) return;

        try {
            const newTitle = `✅ ${currentTitle.replace("✅ ", "")}`;
            await this.googleService.updateEvent(integration.accessToken, eventId, {
                summary: newTitle,
                colorId: "10" // Green (Basil)
            });
        } catch (error) {
            console.error(`[ConfirmUseCase] Failed to update Google Calendar for event ${eventId}:`, error);
        }
    }

    private extractPhoneNumber(text: string): string | null {
        const regex = /(?:(?:\+|00)55\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\d|[2-9])\d{3})\-?(\d{4}))/g;
        const match = regex.exec(text);

        if (match) {
            const ddd = match[1] || "11";
            const part1 = match[2];
            const part2 = match[3];
            return `55${ddd}${part1}${part2}`;
        }

        return null;
    }
}
