import { IScheduleRepository } from "../repositories/ischedule-repository";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { IEvolutionService } from "../ports/ievolution-service";
import { SilentWindowService } from "../chatbot/silent-window.service";
import { CheckUsageLimitUseCase } from "../subscription/check-usage-limit.usecase";
import { t, type Locale } from "../../shared/i18n";

const NOTIFICATION_WINDOW_FLOOR_MS = 2 * 60 * 60 * 1000;
const NOTIFICATION_WINDOW_CEILING_MS = 24 * 60 * 60 * 1000;

export class NotifyUpcomingAppointmentsUseCase {
    constructor(
        private readonly scheduleRepository: IScheduleRepository,
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly evolutionService: IEvolutionService,
        private readonly silentWindow: SilentWindowService,
        private readonly checkUsageLimit: CheckUsageLimitUseCase
    ) {}

    async execute(): Promise<void> {
        const configs = await this.companyConfigRepository.findAllActive();

        const now = new Date();
        const windowStart = new Date(now.getTime() + NOTIFICATION_WINDOW_FLOOR_MS);
        const windowEnd = new Date(now.getTime() + NOTIFICATION_WINDOW_CEILING_MS);

        for (const config of configs) {
            if (!config.whatsappInstanceName || !config.whatsappNumber) continue;
            if (this.silentWindow.isSilent(config)) continue;

            try {
                const usage = await this.checkUsageLimit.execute(config.companyId);
                if (!usage.canSend) continue;

                const remainingQuota = usage.limit === -1
                    ? Number.POSITIVE_INFINITY
                    : usage.limit - usage.count;

                const upcoming = await this.scheduleRepository.findUpcomingForNotification(
                    config.companyId,
                    windowStart,
                    windowEnd
                );

                let sent = 0;
                for (const schedule of upcoming) {
                    if (sent >= remainingQuota) break;

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
                        sent++;
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
