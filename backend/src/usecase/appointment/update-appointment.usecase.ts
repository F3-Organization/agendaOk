import { IScheduleRepository } from "../repositories/ischedule-repository";
import { Schedule } from "../../infra/database/entities/schedule.entity";
import { AppError } from "../../shared/errors/app-error";
import { t, type Locale } from "../../shared/i18n";

export class UpdateAppointmentUseCase {
    constructor(private readonly scheduleRepository: IScheduleRepository) {}

    async execute(id: string, companyId: string, data: Partial<Schedule>, locale: Locale = "pt"): Promise<void> {
        const schedule = await this.scheduleRepository.findById(id);
        if (!schedule || schedule.companyId !== companyId) {
            throw new AppError(t(locale, "appointment.notFound"), 404);
        }
        await this.scheduleRepository.update(id, data);
    }
}
