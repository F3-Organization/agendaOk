import { Schedule, ScheduleStatus } from "../../infra/database/entities/schedule.entity";

export interface IScheduleRepository {
    save(schedule: Schedule): Promise<Schedule>;
    findByGoogleEventId(googleEventId: string): Promise<Schedule | null>;
    findByUserId(userId: string): Promise<Schedule[]>;
    findNextToNotify(userId: string, startRange: Date, endRange: Date): Promise<Schedule[]>;
    updateStatus(id: string, userId: string, status: ScheduleStatus): Promise<void>;
    updateNotified(id: string, userId: string, isNotified: boolean): Promise<void>;
}
