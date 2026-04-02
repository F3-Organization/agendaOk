import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from "typeorm";
import { User } from "./user.entity";
import { Schedule } from "./schedule.entity";
import { BaseEntity } from "./base.entity";

@Entity("clients")
@Index(["userId", "phone"])
export class Client extends BaseEntity {
    @Column({ name: "name" })
    name!: string;

    @Column({ nullable: true, name: "email" })
    email?: string;

    @Column({ name: "phone" })
    phone!: string;

    @Column({ name: "user_id" })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @OneToMany(() => Schedule, (schedule) => schedule.client)
    schedules?: Schedule[];
}
