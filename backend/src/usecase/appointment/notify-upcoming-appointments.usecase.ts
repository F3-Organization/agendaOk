import { IScheduleRepository } from "../repositories/ischedule-repository";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { IEvolutionService } from "../ports/ievolution-service";

export class NotifyUpcomingAppointmentsUseCase {
    constructor(
        private readonly scheduleRepository: IScheduleRepository,
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly evolutionService: IEvolutionService
    ) {}

    async execute(): Promise<void> {
        const configs = await this.companyConfigRepository.findAllActive();

        const now = new Date();
        const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        for (const config of configs) {
            if (!config.whatsappInstanceName || !config.whatsappNumber) continue;

            try {
                const upcoming = await this.scheduleRepository.findUpcomingForNotification(
                    config.companyId,
                    now,
                    windowEnd
                );

                for (const schedule of upcoming) {
                    try {
                        const date = schedule.startAt.toLocaleDateString("pt-BR");
                        const time = schedule.startAt.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                        });

                        const message =
                            `🔔 *Lembrete de Agendamento*\n\n` +
                            `Olá, *${schedule.clientName}*! Você tem um agendamento marcado:\n\n` +
                            `*${schedule.title}*\n` +
                            `📅 ${date} às ${time}\n\n` +
                            `Responda *SIM* para confirmar ou *NÃO* para cancelar.`;

                        const target = schedule.clientPhone.startsWith("55")
                            ? schedule.clientPhone
                            : `55${schedule.clientPhone}`;

                        await this.evolutionService.sendText(
                            config.whatsappInstanceName!,
                            target,
                            message
                        );

                        await this.scheduleRepository.update(schedule.id, { isNotified: true });
                    } catch (err) {
                        console.error(
                            `[Notify] Failed to notify schedule ${schedule.id}:`,
                            err
                        );
                    }
                }
            } catch (err) {
                console.error(
                    `[Notify] Failed to process company ${config.companyId}:`,
                    err
                );
            }
        }
    }
}
