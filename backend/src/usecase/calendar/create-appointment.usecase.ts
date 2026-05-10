import { IGoogleCalendarService } from "../ports/igoogle-calendar-service";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { IIntegrationRepository } from "../repositories/iintegration-repository";
import { Schedule, ScheduleStatus } from "../../infra/database/entities/schedule.entity";

interface CreateAppointmentInput {
    title: string;
    clientName: string;
    clientPhone: string;
    startAt: Date;
    endAt: Date;
    companyId: string;
}

export class CreateAppointmentUseCase {
    constructor(
        private readonly googleService: IGoogleCalendarService,
        private readonly scheduleRepository: IScheduleRepository,
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly integrationRepository: IIntegrationRepository
    ) {}

    async execute(input: CreateAppointmentInput): Promise<Schedule> {
        const config = await this.companyConfigRepository.findByCompanyId(input.companyId);
        const integration = await this.integrationRepository.findByCompanyAndProvider(input.companyId, "GOOGLE");
        
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

        const description = `Gerado via ConfirmaZap\nCliente: ${input.clientName}\nTelefone: ${input.clientPhone}`;

        const eventDetails = {
            summary: input.title,
            description: description,
            start: {
                dateTime: input.startAt.toISOString(),
            },
            end: {
                dateTime: input.endAt.toISOString(),
            }
        };

        const googleEvent = await this.googleService.createEvent(accessToken, eventDetails);

        const schedule = new Schedule();
        schedule.googleEventId = googleEvent.id;
        schedule.title = input.title;
        schedule.description = description;
        schedule.startAt = input.startAt;
        schedule.endAt = input.endAt;
        schedule.status = ScheduleStatus.PENDING;
        schedule.companyId = input.companyId;

        return await this.scheduleRepository.save(schedule);
    }                       

    private isTokenExpired(expiry?: Date | null): boolean {
        if (!expiry) return true;
        const now = new Date();
        return now.getTime() >= (expiry.getTime() - 300000); // 5 minutes margin
    }
}
