import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("user_configs")
export class UserConfig {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", unique: true })
    userId!: string;

    @OneToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ name: "whatsapp_number", nullable: true })
    whatsappNumber?: string;

    @Column({ name: "whatsapp_instance_name", nullable: true })
    whatsappInstanceName?: string;

    @Column({ name: "whatsapp_lid", nullable: true })
    whatsappLid?: string;

    @Column({ name: "last_message_id", nullable: true })
    lastMessageId?: string;

    @Column({ name: "tax_id", nullable: true })
    taxId?: string;

    @Column({ name: "google_access_token", type: "text", nullable: true })
    googleAccessToken?: string;

    @Column({ name: "google_refresh_token", type: "text", nullable: true })
    googleRefreshToken?: string;

    @Column({ name: "google_token_expiry", type: "timestamp", nullable: true })
    googleTokenExpiry?: Date;

    @Column({ name: "silent_window_start", default: "23:59" })
    silentWindowStart!: string;

    @Column({ name: "silent_window_end", default: "08:00" })
    silentWindowEnd!: string;

    @Column({ name: "sync_enabled", default: true })
    syncEnabled!: boolean;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}
