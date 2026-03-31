import { IGoogleCalendarService } from "../ports/igoogle-calendar-service";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { IEvolutionService } from "../ports/ievolution-service";
import { CheckUsageLimitUseCase } from "../subscription/check-usage-limit.usecase";
import { Schedule, ScheduleStatus } from "../../infra/database/entities/schedule.entity";
import { env } from "../../infra/config/configs";

export class SyncCalendarUseCase {
    constructor(
        private readonly googleService: IGoogleCalendarService,
        private readonly scheduleRepository: IScheduleRepository,
        private readonly userConfigRepository: IUserConfigRepository,
        private readonly evolutionService: IEvolutionService,
        private readonly checkUsageLimit: CheckUsageLimitUseCase
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
            const isOwner = event.organizer ? event.organizer.self !== false : true;

            let schedule: Schedule;

            if (existing) {
                existing.title = event.summary || "Sem Título";
                existing.description = event.description;
                existing.startAt = startAt;
                existing.endAt = endAt;
                existing.attendees = event.attendees || [];
                existing.isOwner = isOwner;
                await this.scheduleRepository.save(existing);
                schedule = existing;
            } else {
                schedule = new Schedule();
                schedule.googleEventId = event.id;
                schedule.title = event.summary || "Sem Título";
                schedule.description = event.description;
                schedule.startAt = startAt;
                schedule.endAt = endAt;
                schedule.attendees = event.attendees || [];
                schedule.isOwner = isOwner;
                schedule.status = ScheduleStatus.PENDING;
                schedule.userId = userId;
                
                await this.scheduleRepository.save(schedule);
            }

            // Diagnostic logging for external invites
            if (!schedule.isOwner) {
                const attendees = schedule.attendees || [];
                const selfAttendee = attendees.find((a: any) => a.self);
                
                console.log(`[SyncCalendar] External invite detected: "${schedule.title}"`, {
                    id: schedule.id,
                    isNotified: schedule.isNotified,
                    selfFound: !!selfAttendee,
                    responseStatus: selfAttendee?.responseStatus,
                    whatsappNumber: !!config.whatsappNumber
                });

                // Notify user if it's an external invite they haven't responded to yet
                if (!schedule.isNotified && selfAttendee && selfAttendee.responseStatus === 'needsAction' && config.whatsappNumber) {
                    await this.notifyExternalInvite(config.whatsappNumber, schedule, userId);
                }
            }
        }
    }

    private async notifyExternalInvite(number: string, schedule: Schedule, userId: string): Promise<void> {
        const usage = await this.checkUsageLimit.execute(userId);
        if (!usage.canSend) {
            console.log(`[SyncCalendar] Skipping notification for user ${userId}: Quota reached.`);
            return;
        }

        const dateStr = schedule.startAt.toLocaleDateString('pt-BR');
        const timeStr = schedule.startAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const message = `📅 *Novo Convite de Agendamento*\n\n` +
            `Você foi convidado para: *${schedule.title}*\n` +
            `Data: ${dateStr} às ${timeStr}\n\n` +
            `Deseja aceitar este compromisso? Responda *SIM* para confirmar no seu Google Calendar.`;

        try {
            await this.evolutionService.sendText(env.evolution.systemBotInstance, number, message);
            // Charge the quota by marking as notified
            schedule.isNotified = true;
            schedule.notifiedAt = new Date();
            await this.scheduleRepository.save(schedule);
        } catch (error) {
            console.error(`[SyncCalendar] Failed to send notification to user ${userId}:`, error);
        }
    }

    private isTokenExpired(expiry?: Date): boolean {
        if (!expiry) return true;
        const now = new Date();
        return now.getTime() >= (expiry.getTime() - 300000);
    }
}
