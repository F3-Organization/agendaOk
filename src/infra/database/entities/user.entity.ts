import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    name!: string;

    @Column({ type: "varchar", nullable: true })
    password?: string;

    @Column({ name: "google_id", type: "varchar", nullable: true, unique: true })
    googleId?: string;

    @Column({
        type: "enum",
        enum: ["ADMIN", "USER"],
        default: "USER"
    })
    role!: "ADMIN" | "USER";

    @Column({ name: "two_factor_enabled", default: false })
    twoFactorEnabled!: boolean;

    @Column({ name: "two_factor_secret", type: "varchar", nullable: true })
    twoFactorSecret?: string | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
