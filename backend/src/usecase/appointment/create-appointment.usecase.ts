import { IScheduleRepository } from "../repositories/ischedule-repository";
import { Schedule, ScheduleStatus } from "../../infra/database/entities/schedule.entity";
import { AppError } from "../../shared/errors/app-error";
import { t, type Locale } from "../../shared/i18n";

export interface CreateAppointmentInput {
    companyId: string;
    clientName: string;
    clientPhone: string;
    title: string;
    startAt: Date;
    endAt?: Date;
    notes?: string;
    professionalId?: string;
}

export class CreateAppointmentUseCase {
    constructor(private readonly scheduleRepository: IScheduleRepository) {}

    async execute(input: CreateAppointmentInput, locale: Locale = "pt"): Promise<Schedule> {
        const defaultDuration = 30 * 60 * 1000;
        const endAt = input.endAt || new Date(input.startAt.getTime() + defaultDuration);
        const normalizedPhone = input.clientPhone.replace(/\D/g, "");

        const cancelledDuplicate = await this.scheduleRepository.findCancelledDuplicate(
            input.companyId,
            normalizedPhone,
            input.startAt,
            input.professionalId
        );

        if (cancelledDuplicate) {
            await this.scheduleRepository.update(cancelledDuplicate.id, {
                status: ScheduleStatus.PENDING,
                clientName: input.clientName,
                title: input.title,
                endAt,
                ...(input.notes !== undefined ? { notes: input.notes } : {}),
            });
            return { ...cancelledDuplicate, status: ScheduleStatus.PENDING, endAt };
        }

        const hasConflict = await this.scheduleRepository.hasConflict(
            input.companyId,
            input.startAt,
            endAt,
            input.professionalId
        );

        if (hasConflict) {
            throw new AppError(t(locale, "appointment.conflict"), 409);
        }

        return await this.scheduleRepository.save({
            companyId: input.companyId,
            clientName: input.clientName,
            clientPhone: normalizedPhone,
            title: input.title,
            startAt: input.startAt,
            endAt,
            ...(input.notes !== undefined ? { notes: input.notes } : {}),
            ...(input.professionalId !== undefined ? { professionalId: input.professionalId } : {}),
            status: ScheduleStatus.PENDING,
            isNotified: false,
        });
    }
}
