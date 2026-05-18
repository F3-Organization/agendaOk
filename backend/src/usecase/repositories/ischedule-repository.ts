import { Schedule } from "../../infra/database/entities/schedule.entity";

export interface IScheduleRepository {
    save(schedule: Partial<Schedule>): Promise<Schedule>;
    findById(id: string): Promise<Schedule | null>;
    findByCompanyId(companyId: string): Promise<Schedule[]>;
    findByProfessionalId(professionalId: string): Promise<Schedule[]>;
    findByClientPhone(companyId: string, phone: string): Promise<Schedule[]>;
    findByDateRange(companyId: string, from: Date, to: Date, professionalId?: string): Promise<Schedule[]>;
    findUpcomingForNotification(companyId: string, from: Date, to: Date): Promise<Schedule[]>;
    findPendingByClientPhone(companyId: string, phone: string): Promise<Schedule | null>;
    hasConflict(companyId: string, startAt: Date, endAt: Date, professionalId?: string, excludeId?: string): Promise<boolean>;
    findCancelledDuplicate(companyId: string, clientPhone: string, startAt: Date, professionalId?: string): Promise<Schedule | null>;
    update(id: string, data: Partial<Schedule>): Promise<void>;
    delete(id: string): Promise<void>;
    countMonthlyNotifications(companyId: string, start: Date, end: Date): Promise<number>;
    countByStatus(companyId: string, status: import("../../infra/database/entities/schedule.entity").ScheduleStatus, start: Date, end: Date): Promise<number>;
}
