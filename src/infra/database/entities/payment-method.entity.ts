import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("payment_methods")
export class PaymentMethod extends BaseEntity {
    @Column({ name: "code", type: "varchar", length: 50, unique: true })
    @Index()
    code!: string;

    @Column({ name: "name", type: "varchar", length: 100 })
    name!: string;

    @Column({ name: "description", type: "varchar", length: 255, nullable: true })
    description?: string;

    @Column({ name: "is_active", type: "boolean", default: true })
    isActive!: boolean;
}
