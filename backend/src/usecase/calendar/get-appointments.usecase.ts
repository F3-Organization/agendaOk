import { IScheduleRepository } from "../repositories/ischedule-repository";
import { Schedule } from "../../infra/database/entities/schedule.entity";

export class GetAppointmentsUseCase {
    constructor(private readonly scheduleRepo: IScheduleRepository) {}

    async execute(companyId: string): Promise<(Schedule & { clientName: string; clientPhone: string; attendees: any[] })[]> {
        const schedules = await this.scheduleRepo.findByCompanyId(companyId);
        
        return schedules.map(schedule => {
            let clientName = "";
            let clientPhone = "";

            if (schedule.description) {
                const clientMatch = schedule.description.match(/Cliente:\s*([^\n]*)/);
                const phoneMatch = schedule.description.match(/Telefone:\s*([^\n]*)/);
                
                if (clientMatch && clientMatch[1]) clientName = clientMatch[1].trim();
                if (phoneMatch && phoneMatch[1]) clientPhone = phoneMatch[1].trim();
            }

            return {
                ...schedule,
                clientName,
                clientPhone,
                attendees: schedule.attendees?.map((a: any) => ({
                    email: a.email,
                    responseStatus: a.responseStatus,
                    displayName: a.displayName,
                })) || [],
                isOwner: !!schedule.isOwner,
            };
        });
    }
}
