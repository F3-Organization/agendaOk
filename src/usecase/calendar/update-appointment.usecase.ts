import { IGoogleCalendarService } from "../ports/igoogle-calendar-service";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { IIntegrationRepository } from "../repositories/iintegration-repository";
import { Schedule } from "../../infra/database/entities/schedule.entity";

interface UpdateAppointmentInput {
    id: string;
    title: string;
    clientName: string;
    clientPhone: string;
    startAt: Date;
    endAt: Date;
    userId: string;
}

export class UpdateAppointmentUseCase {
    constructor(
        private readonly googleService: IGoogleCalendarService,
        private readonly scheduleRepository: IScheduleRepository,
        private readonly userConfigRepository: IUserConfigRepository,
        private readonly integrationRepository: IIntegrationRepository
    ) {}

    async execute(input: UpdateAppointmentInput): Promise<Schedule> {
        const schedule = await this.scheduleRepository.findById(input.id, input.userId);
        if (!schedule) {
            throw new Error("Agendamento não encontrado.");
        }

        const config = await this.userConfigRepository.findByUserId(input.userId);
        const integration = await this.integrationRepository.findByUserAndProvider(input.userId, "GOOGLE");
        
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

        await this.googleService.updateEvent(accessToken, schedule.googleEventId, eventDetails);

        schedule.title = input.title;
        schedule.description = description;
        schedule.startAt = input.startAt;
        schedule.endAt = input.endAt;

        return await this.scheduleRepository.save(schedule);
    }

    private isTokenExpired(expiry?: Date | null): boolean {
        if (!expiry) return true;
        const now = new Date();
        return now.getTime() >= (expiry.getTime() - 300000); // 5 minutes margin
    }
}
