import { Repository, Between } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Schedule, ScheduleStatus } from "../entities/schedule.entity";
import { IScheduleRepository } from "../../../usecase/repositories/ischedule-repository";

export class ScheduleRepository implements IScheduleRepository {
    private repository: Repository<Schedule>;

    constructor() {
        this.repository = AppDataSource.getRepository(Schedule);
    }

    async save(schedule: Schedule): Promise<Schedule> {
        return await this.repository.save(schedule);
    }

    async findById(id: string, companyId: string): Promise<Schedule | null> {
        return await this.repository.findOne({ where: { id, companyId } });
    }

    async findByGoogleEventId(googleEventId: string): Promise<Schedule | null> {
        return await this.repository.findOneBy({ googleEventId });
    }

    async findByCompanyId(companyId: string): Promise<Schedule[]> {
        return await this.repository.find({ where: { companyId } });
    }

    async findNextToNotify(companyId: string, startRange: Date, endRange: Date): Promise<Schedule[]> {
        return await this.repository.find({
            where: {
                companyId,
                startAt: Between(startRange, endRange),
                status: ScheduleStatus.PENDING,
                isNotified: false
            },
        });
    }

    async updateStatus(id: string, companyId: string, status: ScheduleStatus): Promise<void> {
        await this.repository.update({ id, companyId }, { status });
    }

    async updateNotified(id: string, companyId: string, isNotified: boolean, notifiedAt?: Date): Promise<void> {
        const updateData: any = { isNotified };
        if (notifiedAt) updateData.notifiedAt = notifiedAt;
        await this.repository.update({ id, companyId }, updateData);
    }

    async countMonthlyNotifications(companyId: string, startDate: Date, endDate: Date): Promise<number> {
        return await this.repository.count({
            where: {
                companyId,
                isNotified: true,
                notifiedAt: Between(startDate, endDate)
            }
        });
    }

    async delete(id: string, companyId: string): Promise<void> {
        await this.repository.delete({ id, companyId });
    }

    async findLastPendingInvite(companyId: string): Promise<Schedule | null> {
        return await this.repository.findOne({
            where: {
                companyId,
                isOwner: false,
                status: ScheduleStatus.PENDING
            },
            order: {
                startAt: "DESC"
            }
        });
    }
}
