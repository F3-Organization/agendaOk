import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Subscription } from "./subscription.entity";

export enum SubscriptionPaymentStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED",
    EXPIRED = "EXPIRED"
}

@Entity("subscription_payments")
export class SubscriptionPayment {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "subscription_id" })
    subscriptionId!: string;

    @ManyToOne(() => Subscription, (subscription) => subscription.payments)
    @JoinColumn({ name: "subscription_id" })
    subscription!: Subscription;

    @Column({
        type: "enum",
        enum: SubscriptionPaymentStatus,
        default: SubscriptionPaymentStatus.PENDING
    })
    status!: SubscriptionPaymentStatus;

    @Column({ type: "integer" })
    amount!: number;

    @Column({ name: "billing_id" })
    billingId!: string;

    @Column({ name: "checkout_url", type: "text" })
    checkoutUrl!: string;

    @Column({ name: "paid_at", type: "timestamp", nullable: true })
    paidAt?: Date;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}
