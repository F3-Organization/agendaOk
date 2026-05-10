import { IEvolutionService } from "../ports/ievolution-service";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { IClientRepository } from "../repositories/iclient-repository";
import { ISubscriptionRepository } from "../repositories/isubscription-repository";
import { CheckUsageLimitUseCase } from "../subscription/check-usage-limit.usecase";

export class NotifyUpcomingAppointmentsUseCase {
    constructor(
        private readonly scheduleRepository: IScheduleRepository,
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly clientRepository: IClientRepository,
        private readonly subscriptionRepository: ISubscriptionRepository,
        private readonly evolutionService: IEvolutionService,
        private readonly checkUsageLimit: CheckUsageLimitUseCase
    ) {}

    async execute(companyId: string): Promise<void> {
        const config = await this.companyConfigRepository.findByCompanyId(companyId);
        if (!config || !config.whatsappInstanceName) {
            return;
        }

        const usage = await this.checkUsageLimit.execute(companyId);
        const isPro = usage.plan === "PRO";
        let currentMonthCount = usage.count;

        if (!usage.canSend && !isPro) {
            console.log(`[NotifyUseCase] User ${companyId} has reached the 50-message limit for FREE plan. Skipping.`);
            return;
        }

        const now = new Date();
        const next24h = new Date();
        next24h.setHours(now.getHours() + 24);

        if (this.isSilenceWindow()) {
            console.log(`[NotifyUseCase] Still in silence window. Skipping notifications.`);
            return;
        }

        const appointments = await this.scheduleRepository.findNextToNotify(companyId, now, next24h);

        for (const appointment of appointments) {
            if (!isPro && currentMonthCount >= 50) {
                console.log(`[NotifyUseCase] User ${companyId} hit the 50-message limit during processing. Skipping remaining.`);
                break;
            }

            let phoneNumber = this.extractPhoneNumber(`${appointment.title} ${appointment.description || ""}`);
            
            if (!phoneNumber && appointment.clientId) {
                const client = await this.clientRepository.findById(appointment.clientId, companyId);
                if (client?.phone) {
                    phoneNumber = client.phone;
                }
            }

            if (!phoneNumber) {
                const client = await this.clientRepository.findByNameOrEmail(companyId, appointment.title);
                if (client?.phone) {
                    phoneNumber = client.phone;
                }
            }
            
            if (phoneNumber) {
                const message = `Olá! Você tem um agendamento para "${appointment.title}" amanhã às ${appointment.startAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}. Podemos confirmar?`;
                
                try {
                    await this.evolutionService.sendText(config.whatsappInstanceName, phoneNumber, message);
                    await this.scheduleRepository.updateNotified(appointment.id, companyId, true, new Date());
                    if (!isPro) currentMonthCount++;
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
