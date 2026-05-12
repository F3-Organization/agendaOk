import { IScheduleRepository } from "../repositories/ischedule-repository";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { IEvolutionService } from "../ports/ievolution-service";
import { t, type Locale } from "../../shared/i18n";

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
                        const locale = (config.locale ?? "pt") as Locale;
                        const dateLocale = locale === "en" ? "en-US" : "pt-BR";

                        const date = schedule.startAt.toLocaleDateString(dateLocale);
                        const time = schedule.startAt.toLocaleTimeString(dateLocale, {
                            hour: "2-digit",
                            minute: "2-digit",
                        });

                        const message = t(locale, "whatsapp.appointmentReminder", {
                            clientName: schedule.clientName,
                            title: schedule.title,
                            date,
                            time,
                        });

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
