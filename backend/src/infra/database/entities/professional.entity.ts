import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Company } from "./company.entity";
import { BaseEntity } from "./base.entity";

@Entity("professionals")
@Index(["companyId"])
export class Professional extends BaseEntity {
    @Column({ name: "company_id" })
    companyId!: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company!: Company;

    @Column()
    name!: string;

    @Column({ nullable: true })
    specialty?: string;

    @Column({ type: "jsonb", name: "working_hours", nullable: true })
    workingHours?: Record<string, Array<{ start: string; end: string }>>;

    @Column({ name: "appointment_duration", default: 60 })
    appointmentDuration!: number;

    @Column({ default: true })
    active!: boolean;
}
