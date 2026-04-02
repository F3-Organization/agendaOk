import { Subscription, SubscriptionStatus } from "../../infra/database/entities/subscription.entity";

export interface ISubscriptionRepository {
    findByUserId(userId: string): Promise<Subscription | null>;
    save(subscription: Partial<Subscription>): Promise<Subscription>;
    createOrUpdate(userId: string, data: Partial<Subscription>): Promise<Subscription>;
    findByBillingId(billingId: string): Promise<Subscription | null>;
    findActiveByUserId(userId: string): Promise<Subscription | null>;
    updateStatus(id: string, userId: string, status: SubscriptionStatus, periodEnd?: Date, plan?: string): Promise<void>;
    deactivateOthers(userId: string, activeId: string): Promise<void>;
}
