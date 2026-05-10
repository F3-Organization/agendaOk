import { IScheduleRepository } from "../repositories/ischedule-repository";
import { Schedule } from "../../infra/database/entities/schedule.entity";
import { AppError } from "../../shared/errors/app-error";

export class UpdateAppointmentUseCase {
    constructor(private readonly scheduleRepository: IScheduleRepository) {}

    async execute(id: string, companyId: string, data: Partial<Schedule>): Promise<void> {
        const schedule = await this.scheduleRepository.findById(id);
        if (!schedule || schedule.companyId !== companyId) {
            throw new AppError("Agendamento não encontrado", 404);
        }
        await this.scheduleRepository.update(id, data);
    }
}
