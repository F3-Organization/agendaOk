import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Subscription, SubscriptionStatus } from "../entities/subscription.entity";

export class SubscriptionRepository {
    private readonly repository: Repository<Subscription>;

    constructor() {
        this.repository = AppDataSource.getRepository(Subscription);
    }

    async findByUserId(userId: string): Promise<Subscription | null> {
        return await this.repository.findOne({ where: { userId } });
    }

    async save(subscription: Partial<Subscription>): Promise<Subscription> {
        return await this.repository.save(this.repository.create(subscription));
    }

    async createOrUpdate(userId: string, data: Partial<Subscription>): Promise<Subscription> {
        let subscription = await this.findByUserId(userId);
        if (subscription) {
            Object.assign(subscription, data);
            return await this.repository.save(subscription);
        }
        return await this.save({ userId, ...data });
    }

    async findByBillingId(billingId: string): Promise<Subscription | null> {
        return await this.repository.findOne({ where: { abacateBillingId: billingId } });
    }

    async updateStatus(id: string, userId: string, status: SubscriptionStatus, periodEnd?: Date): Promise<void> {
        const updateData: any = { status };
        if (periodEnd) {
            updateData.currentPeriodEnd = periodEnd;
        }
        await this.repository.update({ id, userId }, updateData);
    }
}
