import { IEvolutionService } from "../ports/ievolution-service";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { IClientRepository } from "../repositories/iclient-repository";

export class NotifyUpcomingAppointmentsUseCase {
    constructor(
        private readonly scheduleRepository: IScheduleRepository,
        private readonly userConfigRepository: IUserConfigRepository,
        private readonly clientRepository: IClientRepository,
        private readonly evolutionService: IEvolutionService
    ) {}

    async execute(userId: string): Promise<void> {
        const config = await this.userConfigRepository.findByUserId(userId);
        if (!config || !config.whatsappInstanceName) {
            return;
        }

        const now = new Date();
        const next24h = new Date();
        next24h.setHours(now.getHours() + 24);

        if (this.isSilenceWindow()) {
            console.log(`[NotifyUseCase] Still in silence window. Skipping notifications.`);
            return;
        }

        const appointments = await this.scheduleRepository.findNextToNotify(userId, now, next24h);

        for (const appointment of appointments) {
            let phoneNumber = this.extractPhoneNumber(`${appointment.title} ${appointment.description || ""}`);
            
            if (!phoneNumber && appointment.clientId) {
                const client = await this.clientRepository.findById(appointment.clientId);
                if (client?.phone) {
                    phoneNumber = client.phone;
                }
            }

            if (!phoneNumber) {
                const client = await this.clientRepository.findByNameOrEmail(userId, appointment.title);
                if (client?.phone) {
                    phoneNumber = client.phone;
                }
            }
            
            if (phoneNumber) {
                const message = `Olá! Você tem um agendamento para "${appointment.title}" amanhã às ${appointment.startAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}. Podemos confirmar?`;
                
                try {
                    await this.evolutionService.sendText(config.whatsappInstanceName, phoneNumber, message);
                    await this.scheduleRepository.updateNotified(appointment.id, userId, true);
                } catch (error) {
                    console.error(`[NotifyUseCase] Failed to send notification for appointment ${appointment.id}:`, error);
                }
            }
        }
    }

    private isSilenceWindow(): boolean {
        const now = new Date();
        const hour = now.getHours();
        // 21h às 08h
        return hour >= 21 || hour < 8;
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
