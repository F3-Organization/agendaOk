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

    async findById(id: string, userId: string): Promise<Schedule | null> {
        return await this.repository.findOne({ where: { id, userId } });
    }

    async findByGoogleEventId(googleEventId: string): Promise<Schedule | null> {
        return await this.repository.findOneBy({ googleEventId });
    }

    async findByUserId(userId: string): Promise<Schedule[]> {
        return await this.repository.find({ where: { userId } });
    }

    async findNextToNotify(userId: string, startRange: Date, endRange: Date): Promise<Schedule[]> {
        return await this.repository.find({
            where: {
                userId,
                startAt: Between(startRange, endRange),
                status: ScheduleStatus.PENDING,
                isNotified: false
            },
        });
    }

    async updateStatus(id: string, userId: string, status: ScheduleStatus): Promise<void> {
        await this.repository.update({ id, userId }, { status });
    }

    async updateNotified(id: string, userId: string, isNotified: boolean, notifiedAt?: Date): Promise<void> {
        const updateData: any = { isNotified };
        if (notifiedAt) updateData.notifiedAt = notifiedAt;
        await this.repository.update({ id, userId }, updateData);
    }

    async countMonthlyNotifications(userId: string, startDate: Date, endDate: Date): Promise<number> {
        return await this.repository.count({
            where: {
                userId,
                isNotified: true,
                notifiedAt: Between(startDate, endDate)
            }
        });
    }

    async delete(id: string, userId: string): Promise<void> {
        await this.repository.delete({ id, userId });
    }

    async findLastPendingInvite(userId: string): Promise<Schedule | null> {
        return await this.repository.findOne({
            where: {
                userId,
                isOwner: false,
                status: ScheduleStatus.PENDING
            },
            order: {
                startAt: "DESC"
            }
        });
    }
}
