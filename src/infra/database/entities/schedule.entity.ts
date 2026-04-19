import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Company } from "./company.entity";
import { Client } from "./client.entity";
import { BaseEntity } from "./base.entity";

export enum ScheduleStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
}

@Entity("schedules")
@Index(["companyId", "startAt"])
export class Schedule extends BaseEntity {
    @Column({ name: "google_event_id", unique: true })
    googleEventId!: string;

    @Column({ name: "title" })
    title!: string;

    @Column({ type: "text", nullable: true, name: "description" })
    description?: string;

    @Column({ name: "attendees", type: "jsonb", nullable: true })
    attendees?: any[];

    @Column({ name: "is_owner", default: true })
    isOwner!: boolean;

    @Column({ name: "start_at", type: "timestamp" })
    startAt!: Date;

    @Column({ name: "end_at", type: "timestamp" })
    endAt!: Date;

    @Column({
        type: "enum",
        enum: ScheduleStatus,
        default: ScheduleStatus.PENDING,
        name: "status"
    })
    status!: ScheduleStatus;

    @Column({ name: "is_notified", default: false })
    isNotified!: boolean;

    @Column({ name: "notified_at", type: "timestamp", nullable: true })
    notifiedAt?: Date;

    @Column({ name: "company_id" })
    companyId!: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company!: Company;

    @Column({ name: "client_id", nullable: true })
    clientId?: string;

    @ManyToOne(() => Client, (client) => client.schedules, { nullable: true })
    @JoinColumn({ name: "client_id" })
    client?: Client;
}
