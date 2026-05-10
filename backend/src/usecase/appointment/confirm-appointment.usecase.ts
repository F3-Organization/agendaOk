import { IScheduleRepository } from "../repositories/ischedule-repository";
import { ScheduleStatus } from "../../infra/database/entities/schedule.entity";

export class ConfirmAppointmentUseCase {
    constructor(private readonly scheduleRepository: IScheduleRepository) {}

    async execute(companyId: string, clientPhone: string): Promise<void> {
        const schedule = await this.scheduleRepository.findPendingByClientPhone(companyId, clientPhone);
        if (!schedule) throw new Error("No pending appointment found for this client");
        await this.scheduleRepository.update(schedule.id, { status: ScheduleStatus.CONFIRMED });
    }
}
