import { IScheduleRepository } from "../repositories/ischedule-repository";
import { Schedule, ScheduleStatus } from "../../infra/database/entities/schedule.entity";

export interface CreateAppointmentInput {
    companyId: string;
    clientName: string;
    clientPhone: string;
    title: string;
    startAt: Date;
    endAt?: Date;
    notes?: string;
}

export class CreateAppointmentUseCase {
    constructor(private readonly scheduleRepository: IScheduleRepository) {}

    async execute(input: CreateAppointmentInput): Promise<Schedule> {
        return await this.scheduleRepository.save({
            companyId: input.companyId,
            clientName: input.clientName,
            clientPhone: input.clientPhone.replace(/\D/g, ""),
            title: input.title,
            startAt: input.startAt,
            endAt: input.endAt,
            notes: input.notes,
            status: ScheduleStatus.PENDING,
            isNotified: false,
        });
    }
}
