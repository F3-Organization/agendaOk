import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("users")
export class User extends BaseEntity {
    @Column({ unique: true, name: "email" })
    email!: string;

    @Column({ name: "name" })
    name!: string;

    @Column({ type: "varchar", nullable: true, name: "password" })
    password?: string;

    @Column({ name: "google_id", type: "varchar", nullable: true, unique: true })
    googleId?: string;

    @Column({
        type: "enum",
        enum: ["ADMIN", "USER"],
        default: "USER",
        name: "role"
    })
    role!: "ADMIN" | "USER";

    @Column({ name: "two_factor_enabled", default: false })
    twoFactorEnabled!: boolean;

    @Column({ name: "two_factor_secret", type: "varchar", nullable: true })
    twoFactorSecret?: string | null;
}
