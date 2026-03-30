import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";
import { Client } from "./client.entity";

export enum ScheduleStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
}

@Entity("schedules")
export class Schedule {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "google_event_id", unique: true })
    googleEventId!: string;

    @Column()
    title!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ type: "jsonb", nullable: true })
    attendees?: any[];

    @Column({ name: "start_at" })
    startAt!: Date;

    @Column({ name: "end_at" })
    endAt!: Date;

    @Column({
        type: "enum",
        enum: ScheduleStatus,
        default: ScheduleStatus.PENDING,
    })
    status!: ScheduleStatus;

    @Column({ name: "is_notified", default: false })
    isNotified!: boolean;

    @Column({ name: "notified_at", type: "timestamp", nullable: true })
    notifiedAt?: Date;

    @Column({ name: "user_id" })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ name: "client_id", nullable: true })
    clientId?: string;

    @ManyToOne(() => Client, (client) => client.schedules, { nullable: true })
    @JoinColumn({ name: "client_id" })
    client?: Client;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}
