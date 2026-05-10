import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from "typeorm";
import { User } from "./user.entity";
import { SubscriptionPayment } from "./subscription-payment.entity";
import { BaseEntity } from "./base.entity";

export enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    CANCELLED = "CANCELLED",
    PAST_DUE = "PAST_DUE",
    TRIAL = "TRIAL",
    INACTIVE = "INACTIVE",
    PENDING = "PENDING"
}

@Entity("subscriptions")
@Index(["userId"])
export class Subscription extends BaseEntity {
    @Column({ name: "user_id" })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ name: "abacate_billing_id", nullable: true })
    abacateBillingId?: string;

    @Column({ name: "abacate_customer_id", nullable: true })
    abacateCustomerId?: string;

    @Column({ default: "FREE", name: "plan" })
    plan!: string;

    @Column({
        type: "enum",
        enum: SubscriptionStatus,
        default: SubscriptionStatus.ACTIVE,
        name: "status"
    })
    status!: SubscriptionStatus;

    @Column({ name: "current_period_end", type: "timestamp", nullable: true })
    currentPeriodEnd?: Date;

    @Column({ name: "checkout_url", type: "text", nullable: true })
    checkoutUrl?: string;

    @OneToMany(() => SubscriptionPayment, (payment) => payment.subscription)
    payments!: SubscriptionPayment[];
}
