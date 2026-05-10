import { IScheduleRepository } from "../repositories/ischedule-repository";
import { AppError } from "../../shared/errors/app-error";

export class DeleteAppointmentUseCase {
    constructor(private readonly scheduleRepository: IScheduleRepository) {}

    async execute(id: string, companyId: string): Promise<void> {
        const schedule = await this.scheduleRepository.findById(id);
        if (!schedule || schedule.companyId !== companyId) {
            throw new AppError("Agendamento não encontrado", 404);
        }
        await this.scheduleRepository.delete(id);
    }
}
