import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Subscription, SubscriptionStatus } from "../entities/subscription.entity";
import { ISubscriptionRepository } from "../../../usecase/repositories/isubscription-repository";

export class SubscriptionRepository implements ISubscriptionRepository {
    private readonly repository: Repository<Subscription>;

    constructor() {
        this.repository = AppDataSource.getRepository(Subscription);
    }

    async findByCompanyId(companyId: string): Promise<Subscription | null> {
        return await this.repository.findOne({ 
            where: { companyId },
            order: { status: "ASC", createdAt: "DESC" }
        });
    }

    async findActiveByCompanyId(companyId: string): Promise<Subscription | null> {
        return await this.repository.findOne({ where: { companyId, status: SubscriptionStatus.ACTIVE } });
    }

    async save(subscription: Partial<Subscription>): Promise<Subscription> {
        return await this.repository.save(this.repository.create(subscription));
    }

    async createOrUpdate(companyId: string, data: Partial<Subscription>): Promise<Subscription> {
        let subscription = await this.findByCompanyId(companyId);
        if (subscription) {
            Object.assign(subscription, data);
            return await this.repository.save(subscription);
        }
        return await this.save({ companyId, ...data });
    }

    async findByBillingId(billingId: string): Promise<Subscription | null> {
        return await this.repository.findOne({ where: { abacateBillingId: billingId } });
    }

    async updateStatus(id: string, companyId: string, status: SubscriptionStatus, periodEnd?: Date, plan?: string): Promise<void> {
        const updateData: Partial<Subscription> = { status };
        if (periodEnd) {
            updateData.currentPeriodEnd = periodEnd;
        }
        if (plan) {
            updateData.plan = plan;
        }
        await this.repository.update({ id, companyId }, updateData as any);
    }

    async deactivateOthers(companyId: string, activeId: string): Promise<void> {
        await this.repository.createQueryBuilder()
            .update(Subscription)
            .set({ status: SubscriptionStatus.INACTIVE })
            .where("company_id = :companyId AND id != :activeId", { companyId, activeId })
            .execute();
    }
}
