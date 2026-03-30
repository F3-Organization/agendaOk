import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, OneToMany } from "typeorm";
import { User } from "./user.entity";
import { SubscriptionPayment } from "./subscription-payment.entity";

export enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    CANCELLED = "CANCELLED",
    PAST_DUE = "PAST_DUE",
    TRIAL = "TRIAL",
    INACTIVE = "INACTIVE"
}

@Entity("subscriptions")
export class Subscription {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", unique: true })
    userId!: string;

    @OneToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ name: "abacate_billing_id", nullable: true })
    abacateBillingId?: string;

    @Column({ name: "abacate_customer_id", nullable: true })
    abacateCustomerId?: string;

    @Column({ default: "PRO" })
    plan!: string;

    @Column({
        type: "enum",
        enum: SubscriptionStatus,
        default: SubscriptionStatus.INACTIVE
    })
    status!: SubscriptionStatus;

    @Column({ name: "current_period_end", type: "timestamp", nullable: true })
    currentPeriodEnd?: Date;

    @Column({ name: "checkout_url", type: "text", nullable: true })
    checkoutUrl?: string;

    @OneToMany(() => SubscriptionPayment, (payment) => payment.subscription)
    payments!: SubscriptionPayment[];

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}
