import { IScheduleRepository } from "../repositories/ischedule-repository";
import { Schedule } from "../../infra/database/entities/schedule.entity";

export class GetAppointmentsUseCase {
    constructor(private readonly scheduleRepository: IScheduleRepository) {}

    async execute(companyId: string, professionalId?: string): Promise<Schedule[]> {
        if (professionalId) {
            return await this.scheduleRepository.findByProfessionalId(professionalId);
        }
        return await this.scheduleRepository.findByCompanyId(companyId);
    }
}
