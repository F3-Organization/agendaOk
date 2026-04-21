import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("webhook_audit_logs")
@Index(["billingId"])
@Index(["eventType"])
export class WebhookAuditLog extends BaseEntity {
    @Column({ name: "event_type", type: "varchar", length: 100 })
    eventType!: string;

    @Column({ name: "billing_id", type: "varchar", length: 255, nullable: true })
    billingId?: string;

    @Column({ name: "user_id", type: "varchar", length: 255, nullable: true })
    userId?: string;

    @Column({ name: "payment_method_code", type: "varchar", length: 50, nullable: true })
    paymentMethodCode?: string;

    @Column({ name: "amount", type: "integer", nullable: true })
    amount?: number;

    @Column({ name: "raw_payload", type: "jsonb" })
    rawPayload!: object;

    @Column({ name: "processed_at", type: "timestamp", nullable: true })
    processedAt?: Date;

    @Column({ name: "error", type: "text", nullable: true })
    error?: string;
}
