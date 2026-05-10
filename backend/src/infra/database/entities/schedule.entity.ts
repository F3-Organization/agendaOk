import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Company } from "./company.entity";
import { BaseEntity } from "./base.entity";

export enum ScheduleStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
}

@Entity("schedules")
@Index(["companyId", "startAt"])
@Index(["companyId", "clientPhone"])
export class Schedule extends BaseEntity {
    @Column({ type: "uuid", name: "company_id" })
    companyId!: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company!: Company;

    @Column({ name: "client_name" })
    clientName!: string;

    @Column({ name: "client_phone" })
    clientPhone!: string;

    @Column({ name: "title" })
    title!: string;

    @Column({ type: "timestamp", name: "start_at" })
    startAt!: Date;

    @Column({ type: "timestamp", name: "end_at", nullable: true })
    endAt?: Date;

    @Column({
        type: "enum",
        enum: ScheduleStatus,
        default: ScheduleStatus.PENDING,
    })
    status!: ScheduleStatus;

    @Column({ type: "boolean", name: "is_notified", default: false })
    isNotified!: boolean;

    @Column({ type: "text", name: "notes", nullable: true })
    notes?: string;
}
