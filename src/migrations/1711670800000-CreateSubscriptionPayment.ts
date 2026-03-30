import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSubscriptionPayment1711670800000 implements MigrationInterface {
    name = 'CreateSubscriptionPayment1711670800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create Status Enum
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."subscription_payments_status_enum" AS ENUM('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // 2. Create Table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "subscription_payments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "subscription_id" uuid NOT NULL,
                "status" "public"."subscription_payments_status_enum" NOT NULL DEFAULT 'PENDING',
                "amount" integer NOT NULL,
                "billing_id" character varying NOT NULL,
                "checkout_url" text NOT NULL,
                "paid_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_subscription_payments" PRIMARY KEY ("id"),
                CONSTRAINT "FK_subscription_payments_subscription" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "subscription_payments"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."subscription_payments_status_enum"`);
    }
}
