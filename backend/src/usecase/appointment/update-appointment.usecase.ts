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

        const timeChanged = (data.startAt && data.startAt.getTime() !== schedule.startAt.getTime())
            || (data.endAt && schedule.endAt && data.endAt.getTime() !== schedule.endAt.getTime());
        const professionalChanged = data.professionalId !== undefined
            && data.professionalId !== schedule.professionalId;

        if (timeChanged || professionalChanged) {
            const startAt = data.startAt || schedule.startAt;
            const endAt = data.endAt || schedule.endAt || new Date(startAt.getTime() + 30 * 60 * 1000);
            const professionalId = data.professionalId !== undefined ? data.professionalId : schedule.professionalId;

            const hasConflict = await this.scheduleRepository.hasConflict(
                companyId,
                startAt,
                endAt,
                professionalId,
                id
            );

            if (hasConflict) {
                throw new AppError(t(locale, "appointment.conflict"), 409);
            }
        }

        await this.scheduleRepository.update(id, data);
    }
}
