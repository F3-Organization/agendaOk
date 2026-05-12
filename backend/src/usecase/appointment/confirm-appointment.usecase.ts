import { IScheduleRepository } from "../repositories/ischedule-repository";
import { ScheduleStatus } from "../../infra/database/entities/schedule.entity";
import { t, type Locale } from "../../shared/i18n";

export class ConfirmAppointmentUseCase {
    constructor(private readonly scheduleRepository: IScheduleRepository) {}

    async execute(companyId: string, clientPhone: string, locale: Locale = "pt"): Promise<void> {
        const schedule = await this.scheduleRepository.findPendingByClientPhone(companyId, clientPhone);
        if (!schedule) throw new Error(t(locale, "appointment.noPending"));
        await this.scheduleRepository.update(schedule.id, { status: ScheduleStatus.CONFIRMED });
    }
}
