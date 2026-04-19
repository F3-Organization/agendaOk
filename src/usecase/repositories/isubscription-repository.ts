import { Subscription, SubscriptionStatus } from "../../infra/database/entities/subscription.entity";

export interface ISubscriptionRepository {
    findByCompanyId(companyId: string): Promise<Subscription | null>;
    save(subscription: Partial<Subscription>): Promise<Subscription>;
    createOrUpdate(companyId: string, data: Partial<Subscription>): Promise<Subscription>;
    findByBillingId(billingId: string): Promise<Subscription | null>;
    findActiveByCompanyId(companyId: string): Promise<Subscription | null>;
    updateStatus(id: string, companyId: string, status: SubscriptionStatus, periodEnd?: Date, plan?: string): Promise<void>;
    deactivateOthers(companyId: string, activeId: string): Promise<void>;
}
