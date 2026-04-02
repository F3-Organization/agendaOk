import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Subscription, SubscriptionStatus } from "../entities/subscription.entity";
import { ISubscriptionRepository } from "../../../usecase/repositories/isubscription-repository";

export class SubscriptionRepository implements ISubscriptionRepository {
    private readonly repository: Repository<Subscription>;

    constructor() {
        this.repository = AppDataSource.getRepository(Subscription);
    }

    async findByUserId(userId: string): Promise<Subscription | null> {
        // Busca a primeira assinatura ativa, ou a mais recente
        return await this.repository.findOne({ 
            where: { userId },
            order: { status: "ASC", createdAt: "DESC" } // ACTIVE vem antes de INATIVO/PENDING alfabeticamente? Não, ACTIVE < PENDING.
        });
    }

    async findActiveByUserId(userId: string): Promise<Subscription | null> {
        return await this.repository.findOne({ where: { userId, status: SubscriptionStatus.ACTIVE } });
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

    async updateStatus(id: string, userId: string, status: SubscriptionStatus, periodEnd?: Date, plan?: string): Promise<void> {
        const updateData: Partial<Subscription> = { status };
        if (periodEnd) {
            updateData.currentPeriodEnd = periodEnd;
        }
        if (plan) {
            updateData.plan = plan;
        }
        await this.repository.update({ id, userId }, updateData as any);
    }

    async deactivateOthers(userId: string, activeId: string): Promise<void> {
        await this.repository.createQueryBuilder()
            .update(Subscription)
            .set({ status: SubscriptionStatus.INACTIVE })
            .where("user_id = :userId AND id != :activeId", { userId, activeId })
            .execute();
    }
}
