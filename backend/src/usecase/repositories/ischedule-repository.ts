import { Schedule, ScheduleStatus } from "../../infra/database/entities/schedule.entity";

export interface IScheduleRepository {
    save(schedule: Schedule): Promise<Schedule>;
    findById(id: string, companyId: string): Promise<Schedule | null>;
    findByGoogleEventId(googleEventId: string): Promise<Schedule | null>;
    findByCompanyId(companyId: string): Promise<Schedule[]>;
    findNextToNotify(companyId: string, startRange: Date, endRange: Date): Promise<Schedule[]>;
    updateStatus(id: string, companyId: string, status: ScheduleStatus): Promise<void>;
    updateNotified(id: string, companyId: string, isNotified: boolean, notifiedAt?: Date): Promise<void>;
    countMonthlyNotifications(companyId: string, startDate: Date, endDate: Date): Promise<number>;
    delete(id: string, companyId: string): Promise<void>;
    findLastPendingInvite(companyId: string): Promise<Schedule | null>;
}
