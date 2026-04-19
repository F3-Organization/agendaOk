import { Entity, Column, OneToOne, JoinColumn } from "typeorm";
import { Company } from "./company.entity";
import { BaseEntity } from "./base.entity";

@Entity("company_configs")
export class CompanyConfig extends BaseEntity {
    @Column({ type: "uuid", name: "company_id", unique: true })
    companyId!: string;

    @OneToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company!: Company;

    @Column({ type: "varchar", name: "whatsapp_number", nullable: true })
    whatsappNumber?: string;

    @Column({ type: "varchar", name: "whatsapp_instance_name", nullable: true })
    whatsappInstanceName?: string;

    @Column({ type: "varchar", name: "whatsapp_lid", nullable: true })
    whatsappLid?: string;

    @Column({ type: "varchar", name: "last_message_id", nullable: true })
    lastMessageId?: string;

    @Column({ type: "varchar", name: "tax_id", nullable: true })
    taxId?: string;

    @Column({ type: "varchar", name: "billing_customer_id", nullable: true })
    billingCustomerId?: string;

    @Column({ type: "varchar", name: "silent_window_start", default: "22:00" })
    silentWindowStart?: string;

    @Column({ type: "varchar", name: "silent_window_end", default: "08:00" })
    silentWindowEnd?: string;

    @Column({ type: "boolean", name: "sync_enabled", default: true })
    syncEnabled?: boolean;
}
