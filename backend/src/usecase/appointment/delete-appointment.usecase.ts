import { IScheduleRepository } from "../repositories/ischedule-repository";
import { AppError } from "../../shared/errors/app-error";
import { t, type Locale } from "../../shared/i18n";

export class DeleteAppointmentUseCase {
    constructor(private readonly scheduleRepository: IScheduleRepository) {}

    async execute(id: string, companyId: string, locale: Locale = "pt"): Promise<void> {
        const schedule = await this.scheduleRepository.findById(id);
        if (!schedule || schedule.companyId !== companyId) {
            throw new AppError(t(locale, "appointment.notFound"), 404);
        }
        await this.scheduleRepository.delete(id);
    }
}
