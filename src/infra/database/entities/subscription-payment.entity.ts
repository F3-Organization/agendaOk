import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Subscription } from "./subscription.entity";
import { PaymentMethod } from "./payment-method.entity";
import { BaseEntity } from "./base.entity";

export enum SubscriptionPaymentStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED",
    EXPIRED = "EXPIRED"
}

@Entity("subscription_payments")
@Index(["subscriptionId"])
export class SubscriptionPayment extends BaseEntity {
    @Column({ name: "subscription_id" })
    subscriptionId!: string;

    @ManyToOne(() => Subscription, (subscription) => subscription.payments)
    @JoinColumn({ name: "subscription_id" })
    subscription!: Subscription;

    @Column({
        type: "enum",
        enum: SubscriptionPaymentStatus,
        default: SubscriptionPaymentStatus.PENDING,
        name: "status"
    })
    status!: SubscriptionPaymentStatus;

    @Column({ type: "integer", name: "amount" })
    amount!: number;

    @Column({ name: "billing_id" })
    billingId!: string;

    @Column({ name: "checkout_url", type: "text" })
    checkoutUrl!: string;

    @Column({ name: "paid_at", type: "timestamp", nullable: true })
    paidAt?: Date;

    @Column({ name: "payment_method_id", type: "uuid", nullable: true })
    paymentMethodId?: string;

    @ManyToOne(() => PaymentMethod, { nullable: true, eager: true })
    @JoinColumn({ name: "payment_method_id" })
    paymentMethod?: PaymentMethod;
}
