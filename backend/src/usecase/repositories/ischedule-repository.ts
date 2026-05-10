import { Schedule } from "../../infra/database/entities/schedule.entity";

export interface IScheduleRepository {
    save(schedule: Partial<Schedule>): Promise<Schedule>;
    findById(id: string): Promise<Schedule | null>;
    findByCompanyId(companyId: string): Promise<Schedule[]>;
    findUpcomingForNotification(companyId: string, from: Date, to: Date): Promise<Schedule[]>;
    findPendingByClientPhone(companyId: string, phone: string): Promise<Schedule | null>;
    update(id: string, data: Partial<Schedule>): Promise<void>;
    delete(id: string): Promise<void>;
    countMonthlyNotifications(companyId: string, start: Date, end: Date): Promise<number>;
}
