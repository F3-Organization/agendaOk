import { Schedule, ScheduleStatus } from "../../infra/database/entities/schedule.entity";

export interface IScheduleRepository {
    save(schedule: Schedule): Promise<Schedule>;
    findById(id: string, userId: string): Promise<Schedule | null>;
    findByGoogleEventId(googleEventId: string): Promise<Schedule | null>;
    findByUserId(userId: string): Promise<Schedule[]>;
    findNextToNotify(userId: string, startRange: Date, endRange: Date): Promise<Schedule[]>;
    updateStatus(id: string, userId: string, status: ScheduleStatus): Promise<void>;
    updateNotified(id: string, userId: string, isNotified: boolean, notifiedAt?: Date): Promise<void>;
    countMonthlyNotifications(userId: string, startDate: Date, endDate: Date): Promise<number>;
    delete(id: string, userId: string): Promise<void>;
    findLastPendingInvite(userId: string): Promise<Schedule | null>;
}
