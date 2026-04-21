import { Entity, Column } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("plans")
export class Plan extends BaseEntity {
    @Column({ type: "varchar", unique: true })
    slug!: string;

    @Column({ type: "varchar" })
    name!: string;

    @Column({ type: "varchar", nullable: true })
    description?: string | null;

    @Column({ type: "integer", name: "price_in_cents", default: 0 })
    priceInCents!: number;

    @Column({ type: "integer", name: "message_limit", nullable: true })
    messageLimit!: number | null;

    @Column({ type: "integer", name: "max_devices", default: 1 })
    maxDevices!: number;

    @Column({ type: "jsonb", default: [] })
    features!: string[];

    @Column({ type: "boolean", name: "is_active", default: true })
    isActive!: boolean;

    @Column({ type: "boolean", name: "is_purchasable", default: false })
    isPurchasable!: boolean;

    @Column({ type: "integer", name: "sort_order", default: 0 })
    sortOrder!: number;

    @Column({ type: "varchar", name: "gateway_product_id", nullable: true })
    gatewayProductId?: string | null;
}
