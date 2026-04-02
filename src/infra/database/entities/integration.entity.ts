import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { User } from "./user.entity";
import { BaseEntity } from "./base.entity";

@Entity("integrations")
@Index(["userId", "provider"], { unique: true })
export class Integration extends BaseEntity {
    @Column({ type: "uuid", name: "user_id" })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ type: "varchar" })
    provider!: string;

    @Column({ type: "text", name: "access_token" })
    accessToken!: string;

    @Column({ type: "text", name: "refresh_token", nullable: true })
    refreshToken?: string | null;

    @Column({ type: "timestamp", name: "expires_at", nullable: true })
    expiresAt?: Date | null;

    @Column({ type: "varchar", name: "provider_user_id", nullable: true })
    providerUserId?: string | null;

    @Column({ type: "jsonb", nullable: true })
    metadata?: any;
}
