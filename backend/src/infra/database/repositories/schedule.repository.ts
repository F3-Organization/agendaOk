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

    async findByProfessionalId(professionalId: string): Promise<Schedule[]> {
        return await this.repository.find({
            where: { professionalId },
            order: { startAt: "DESC" },
        });
    }

    async findByClientPhone(companyId: string, phone: string): Promise<Schedule[]> {
        const normalized = phone.replace(/\D/g, "").replace(/^55/, "");
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        return await this.repository.createQueryBuilder("s")
            .where("s.company_id = :companyId", { companyId })
            .andWhere(
                // Include active future appointments AND recently cancelled (today)
                "(s.status != :cancelled AND s.start_at >= :now) OR (s.status = :cancelled AND s.updated_at >= :todayStart)",
                { cancelled: ScheduleStatus.CANCELLED, now: new Date(), todayStart }
            )
            .andWhere(
                "REGEXP_REPLACE(s.client_phone, '[^0-9]', '', 'g') LIKE :pattern",
                { pattern: `%${normalized}` }
            )
            .orderBy("s.start_at", "ASC")
            .getMany();
    }

    async findByDateRange(companyId: string, from: Date, to: Date, professionalId?: string): Promise<Schedule[]> {
        const qb = this.repository.createQueryBuilder("s")
            .where("s.company_id = :companyId", { companyId })
            .andWhere("s.status != :cancelled", { cancelled: ScheduleStatus.CANCELLED })
            .andWhere("s.start_at >= :from", { from })
            .andWhere("s.start_at < :to", { to });

        if (professionalId) {
            qb.andWhere("s.professional_id = :professionalId", { professionalId });
        }

        return await qb.orderBy("s.start_at", "ASC").getMany();
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
            .andWhere("s.is_notified = :isNotified", { isNotified: true })
            .andWhere(
                "REGEXP_REPLACE(s.client_phone, '[^0-9]', '', 'g') LIKE :pattern",
                { pattern: `%${normalized}` }
            )
            .orderBy("s.start_at", "ASC")
            .getOne();
    }

    async hasConflict(
        companyId: string,
        startAt: Date,
        endAt: Date,
        professionalId?: string,
        excludeId?: string
    ): Promise<boolean> {
        const qb = this.repository.createQueryBuilder("s")
            .where("s.company_id = :companyId", { companyId })
            .andWhere("s.status != :cancelled", { cancelled: ScheduleStatus.CANCELLED })
            // Time overlap: existing.start < newEnd AND existing.end > newStart
            .andWhere("s.start_at < :endAt", { endAt })
            .andWhere("(s.end_at > :startAt OR (s.end_at IS NULL AND s.start_at >= :startAt))", { startAt });

        if (professionalId) {
            qb.andWhere("s.professional_id = :professionalId", { professionalId });
        }

        if (excludeId) {
            qb.andWhere("s.id != :excludeId", { excludeId });
        }

        const count = await qb.getCount();
        return count > 0;
    }

    async findCancelledDuplicate(
        companyId: string,
        clientPhone: string,
        startAt: Date,
        professionalId?: string
    ): Promise<Schedule | null> {
        const normalized = clientPhone.replace(/\D/g, "").replace(/^55/, "");

        const qb = this.repository.createQueryBuilder("s")
            .where("s.company_id = :companyId", { companyId })
            .andWhere("s.status = :cancelled", { cancelled: ScheduleStatus.CANCELLED })
            .andWhere("s.start_at = :startAt", { startAt })
            .andWhere(
                "REGEXP_REPLACE(s.client_phone, '[^0-9]', '', 'g') LIKE :pattern",
                { pattern: `%${normalized}` }
            );

        if (professionalId) {
            qb.andWhere("s.professional_id = :professionalId", { professionalId });
        }

        return await qb.getOne();
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

    async countByStatus(companyId: string, status: ScheduleStatus, start: Date, end: Date): Promise<number> {
        return await this.repository.count({
            where: {
                companyId,
                status,
                startAt: Between(start, end),
            },
        });
    }
}
