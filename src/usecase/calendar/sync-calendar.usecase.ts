import { IGoogleCalendarService } from "../ports/igoogle-calendar-service";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { Schedule, ScheduleStatus } from "../../infra/database/entities/schedule.entity";

export class SyncCalendarUseCase {
    constructor(
        private readonly googleService: IGoogleCalendarService,
        private readonly scheduleRepository: IScheduleRepository,
        private readonly userConfigRepository: IUserConfigRepository
    ) {}

    async execute(userId: string): Promise<void> {
        const config = await this.userConfigRepository.findByUserId(userId);
        if (!config || !config.googleRefreshToken || !config.syncEnabled) {
            return;
        }

        let accessToken = config.googleAccessToken;

        if (this.isTokenExpired(config.googleTokenExpiry)) {
            const tokens = await this.googleService.refreshAccessToken(config.googleRefreshToken);
            
            const newAccessToken = tokens.access_token as string;
            if (!newAccessToken) {
                throw new Error("Failed to refresh Google access token");
            }
            
            accessToken = newAccessToken;

            const expiryDate = new Date();
            if (tokens.expires_in) {
                expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);
            }

            await this.userConfigRepository.update(userId, {
                googleAccessToken: newAccessToken,
                googleTokenExpiry: expiryDate
            });
        }

        if (!accessToken) return;

        const now = new Date();
        const nextSevenDays = new Date();
        nextSevenDays.setDate(now.getDate() + 7);

        const events = await this.googleService.listEvents(accessToken, now, nextSevenDays);

        for (const event of events) {
            const existing = await this.scheduleRepository.findByGoogleEventId(event.id);

            const startAt = new Date(event.start?.dateTime || event.start?.date);
            const endAt = new Date(event.end?.dateTime || event.end?.date);

            if (existing) {
                existing.title = event.summary || "Sem Título";
                existing.description = event.description;
                existing.startAt = startAt;
                existing.endAt = endAt;
                existing.attendees = event.attendees || [];
                await this.scheduleRepository.save(existing);
                continue;
            }

            const schedule = new Schedule();
            schedule.googleEventId = event.id;
            schedule.title = event.summary || "Sem Título";
            schedule.description = event.description;
            schedule.startAt = startAt;
            schedule.endAt = endAt;
            schedule.attendees = event.attendees || [];
            schedule.status = ScheduleStatus.PENDING;
            schedule.userId = userId;

            await this.scheduleRepository.save(schedule);
        }
    }

    private isTokenExpired(expiry?: Date): boolean {
        if (!expiry) return true;
        const now = new Date();
        return now.getTime() >= (expiry.getTime() - 300000);
    }
}
