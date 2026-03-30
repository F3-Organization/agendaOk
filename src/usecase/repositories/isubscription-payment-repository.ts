import { SubscriptionPayment, SubscriptionPaymentStatus } from "../../infra/database/entities/subscription-payment.entity";

export interface ISubscriptionPaymentRepository {
    create(payment: Partial<SubscriptionPayment>): Promise<SubscriptionPayment>;
    update(id: string, data: Partial<SubscriptionPayment>): Promise<void>;
    findByBillingId(billingId: string): Promise<SubscriptionPayment | null>;
    findAllBySubscriptionId(subscriptionId: string): Promise<SubscriptionPayment[]>;
}
