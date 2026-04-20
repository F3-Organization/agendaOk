import { IGoogleCalendarService } from "../ports/igoogle-calendar-service";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { IIntegrationRepository } from "../repositories/iintegration-repository";
import { ScheduleStatus } from "../../infra/database/entities/schedule.entity";

export class DeclineInviteUseCase {
    constructor(
        private readonly googleService: IGoogleCalendarService,
        private readonly scheduleRepository: IScheduleRepository,
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly integrationRepository: IIntegrationRepository
    ) {}

    async execute(companyId: string, appointmentId: string): Promise<void> {
        const schedule = await this.scheduleRepository.findById(appointmentId, companyId);
        if (!schedule) throw new Error("Appointment not found");
        if (schedule.companyId !== companyId) throw new Error("Not authorized");
        
        if (schedule.isOwner) {
            throw new Error("Cannot decline your own event. Delete it instead.");
        }

        const config = await this.companyConfigRepository.findByCompanyId(companyId);
        const integration = await this.integrationRepository.findByCompanyAndProvider(companyId, "GOOGLE");
        
        if (!config || !integration || !integration.accessToken) {
            throw new Error("Google Calendar integration not configured");
        }

        let accessToken = integration.accessToken;

        // Auto-refresh logic
        if (this.isTokenExpired(integration.expiresAt)) {
            const tokens = await this.googleService.refreshAccessToken(integration.refreshToken!);
            accessToken = tokens.access_token;
            
            const expiryDate = new Date();
            if (tokens.expires_in) {
                expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);
            }

            await this.integrationRepository.save({
                id: integration.id,
                accessToken: accessToken,
                expiresAt: expiryDate
            });
        }

        // Search the Google Event
        const event = await this.googleService.getEvent(accessToken, schedule.googleEventId);
        if (!event || !event.attendees) {
            throw new Error("Event or attendees not found in Google Calendar");
        }

        // Find the self attendee and update status
        let updatedSelf = false;
        const mappedAttendees = event.attendees.map((attendee: any) => {
            if (attendee.self) {
                updatedSelf = true;
                return { ...attendee, responseStatus: "declined" };
            }
            return attendee;
        });

        if (!updatedSelf) {
            throw new Error("Current user is not an attendee of this event");
        }

        // Update on Google Calendar
        await this.googleService.updateEvent(accessToken, schedule.googleEventId, {
            attendees: mappedAttendees
        });

        // Update locally
        schedule.attendees = mappedAttendees;
        schedule.status = ScheduleStatus.CANCELLED;
        await this.scheduleRepository.save(schedule);
    }

    private isTokenExpired(expiry?: Date | null): boolean {
        if (!expiry) return true;
        const now = new Date();
        return now.getTime() >= (expiry.getTime() - 300000); // 5 minutes margin
    }
}
