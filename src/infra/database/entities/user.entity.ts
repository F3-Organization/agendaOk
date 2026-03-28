import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    name!: string;

    @Column({ nullable: true })
    password?: string;

    @Column({ name: "google_id", nullable: true, unique: true })
    googleId?: string;

    @Column({
        type: "enum",
        enum: ["ADMIN", "USER"],
        default: "USER"
    })
    role!: "ADMIN" | "USER";

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
