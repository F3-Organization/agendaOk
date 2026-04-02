import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("user_configs")
export class UserConfig {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid", name: "user_id", unique: true })
    userId!: string;

    @OneToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ type: "varchar", name: "whatsapp_number", nullable: true })
    whatsappNumber?: string | undefined;

    @Column({ type: "varchar", name: "whatsapp_instance_name", nullable: true })
    whatsappInstanceName?: string | undefined;

    @Column({ type: "varchar", name: "whatsapp_lid", nullable: true })
    whatsappLid?: string | undefined;

    @Column({ type: "varchar", name: "last_message_id", nullable: true })
    lastMessageId?: string | undefined;

    @Column({ type: "varchar", name: "tax_id", nullable: true })
    taxId?: string | undefined;

    @Column({ name: "google_access_token", type: "text", nullable: true })
    googleAccessToken?: string | undefined;

    @Column({ type: "text", name: "google_refresh_token", nullable: true })
    googleRefreshToken?: string | undefined;

    @Column({ type: "timestamp", name: "google_token_expiry", nullable: true })
    googleTokenExpiry?: Date | undefined;

    @Column({ type: "varchar", name: "silent_window_start", default: "22:00" })
    silentWindowStart?: string | undefined;

    @Column({ type: "varchar", name: "silent_window_end", default: "08:00" })
    silentWindowEnd?: string | undefined;

    @Column({ type: "boolean", name: "sync_enabled", default: true })
    syncEnabled?: boolean | undefined;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}
