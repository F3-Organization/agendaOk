import { SubscriptionPayment, SubscriptionPaymentStatus } from "../../infra/database/entities/subscription-payment.entity";

export interface ISubscriptionPaymentRepository {
    create(payment: Partial<SubscriptionPayment>): Promise<SubscriptionPayment>;
    update(id: string, data: Partial<SubscriptionPayment>): Promise<void>;
    findById(id: string): Promise<SubscriptionPayment | null>;
    findByBillingId(billingId: string): Promise<SubscriptionPayment | null>;
    findAllBySubscriptionId(subscriptionId: string): Promise<SubscriptionPayment[]>;
    findPendingByUser(subscriptionId: string): Promise<SubscriptionPayment | null>;
}
