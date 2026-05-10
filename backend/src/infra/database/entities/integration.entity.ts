import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Company } from "./company.entity";
import { BaseEntity } from "./base.entity";

@Entity("integrations")
@Index(["companyId", "provider"], { unique: true })
export class Integration extends BaseEntity {
    @Column({ type: "uuid", name: "company_id" })
    companyId!: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company!: Company;

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
