import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { User } from "./user.entity";

@Entity("companies")
export class Company extends BaseEntity {
    @Column({ name: "owner_id" })
    ownerId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "owner_id" })
    owner!: User;

    @Column()
    name!: string;

    @Column({ unique: true })
    slug!: string;
}
