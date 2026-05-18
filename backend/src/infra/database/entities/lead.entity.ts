import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("leads")
export class Lead extends BaseEntity {
    @Column({ name: "name" })
    name!: string;

    @Column({ name: "email" })
    @Index()
    email!: string;

    @Column({ name: "phone", type: "varchar", nullable: true })
    phone?: string;

    @Column({ name: "source", type: "varchar", default: "landing" })
    source!: string;
}
