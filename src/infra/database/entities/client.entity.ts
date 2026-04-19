import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from "typeorm";
import { Company } from "./company.entity";
import { Schedule } from "./schedule.entity";
import { BaseEntity } from "./base.entity";

@Entity("clients")
@Index(["companyId", "phone"])
export class Client extends BaseEntity {
    @Column({ name: "name" })
    name!: string;

    @Column({ nullable: true, name: "email" })
    email?: string;

    @Column({ name: "phone" })
    phone!: string;

    @Column({ name: "company_id" })
    companyId!: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company!: Company;

    @OneToMany(() => Schedule, (schedule) => schedule.client)
    schedules?: Schedule[];
}
