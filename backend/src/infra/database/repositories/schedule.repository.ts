import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Schedule, ScheduleStatus } from "../entities/schedule.entity";
import { IScheduleRepository } from "../../../usecase/repositories/ischedule-repository";

export class ScheduleRepository implements IScheduleRepository {
    private repository: Repository<Schedule>;

    constructor() {
        this.repository = AppDataSource.getRepository(Schedule);
    }

    async save(schedule: Partial<Schedule>): Promise<Schedule> {
        return await this.repository.save(schedule);
    }

    async findById(id: string): Promise<Schedule | null> {
        return await this.repository.findOneBy({ id });
    }

    async findByCompanyId(companyId: string): Promise<Schedule[]> {
        return await this.repository.find({
            where: { companyId },
            order: { startAt: "DESC" },
        });
    }

    async findUpcomingForNotification(companyId: string, from: Date, to: Date): Promise<Schedule[]> {
        return await this.repository.find({
            where: {
                companyId,
                status: ScheduleStatus.PENDING,
                isNotified: false,
                startAt: Between(from, to),
            },
        });
    }

    async findPendingByClientPhone(companyId: string, phone: string): Promise<Schedule | null> {
        const normalized = phone.replace(/\D/g, "").replace(/^55/, "");

        return await this.repository.createQueryBuilder("s")
            .where("s.company_id = :companyId", { companyId })
            .andWhere("s.status = :status", { status: ScheduleStatus.PENDING })
            .andWhere(
                "REGEXP_REPLACE(s.client_phone, '[^0-9]', '', 'g') LIKE :pattern",
                { pattern: `%${normalized}` }
            )
            .orderBy("s.start_at", "ASC")
            .getOne();
    }

    async update(id: string, data: Partial<Schedule>): Promise<void> {
        await this.repository.update(id, data);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async countMonthlyNotifications(companyId: string, start: Date, end: Date): Promise<number> {
        return await this.repository.count({
            where: {
                companyId,
                isNotified: true,
                startAt: Between(start, end),
            },
        });
    }
}
