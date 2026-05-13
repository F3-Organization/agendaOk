import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Company } from "./company.entity";
import { BaseEntity } from "./base.entity";

@Entity("company_members")
@Index(["companyId", "userId"], { unique: true })
export class CompanyMember extends BaseEntity {
    @Column({ name: "company_id" })
    companyId!: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company!: Company;

    @Column({ name: "user_id", type: "uuid", nullable: true })
    userId?: string;

    @Column({ name: "invited_email", type: "varchar", nullable: true })
    invitedEmail?: string;

    @Column({
        type: "enum",
        enum: ["ATTENDANT"],
        default: "ATTENDANT",
        name: "role"
    })
    role!: "ATTENDANT";
}
