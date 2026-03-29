import { IGoogleCalendarService } from "../ports/igoogle-calendar-service";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { ScheduleStatus } from "../../infra/database/entities/schedule.entity";

export class CancelAppointmentUseCase {
    constructor(
        private readonly scheduleRepository: IScheduleRepository,
        private readonly userConfigRepository: IUserConfigRepository,
        private readonly googleService: IGoogleCalendarService
    ) {}

    async execute(userId: string, phoneNumber: string): Promise<void> {
        const now = new Date();
        const next7Days = new Date();
        next7Days.setDate(now.getDate() + 7);

        const schedules = await this.scheduleRepository.findNextToNotify(userId, now, next7Days);

        for (const schedule of schedules) {
            const extractedPhone = this.extractPhoneNumber(`${schedule.title} ${schedule.description || ""}`);
            
            if (extractedPhone === phoneNumber) {
                // 1. Atualiza no Banco
                await this.scheduleRepository.updateStatus(schedule.id, userId, ScheduleStatus.CANCELLED);

                // 2. Tenta atualizar no Google
                await this.updateGoogleEvent(userId, schedule.googleEventId, schedule.title);
                
                return; // Cancelamos o primeiro que encontramos (o mais próximo)
            }
        }
    }

    private async updateGoogleEvent(userId: string, eventId: string, currentTitle: string) {
        const config = await this.userConfigRepository.findByUserId(userId);
        if (!config || !config.googleAccessToken) return;

        try {
            const newTitle = `❌ ${currentTitle.replace("❌ ", "").replace("✅ ", "")}`;
            await this.googleService.updateEvent(config.googleAccessToken, eventId, {
                summary: newTitle,
                colorId: "11" // Red (Tomato)
            });
        } catch (error) {
            console.error(`[CancelUseCase] Failed to update Google Calendar for event ${eventId}:`, error);
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
