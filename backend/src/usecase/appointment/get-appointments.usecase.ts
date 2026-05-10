import { IScheduleRepository } from "../repositories/ischedule-repository";
import { Schedule } from "../../infra/database/entities/schedule.entity";

export class GetAppointmentsUseCase {
    constructor(private readonly scheduleRepository: IScheduleRepository) {}

    async execute(companyId: string): Promise<Schedule[]> {
        return await this.scheduleRepository.findByCompanyId(companyId);
    }
}
