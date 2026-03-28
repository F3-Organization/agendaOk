import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthSubscription1711670500000 implements MigrationInterface {
    name = 'AuthSubscription1711670500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add role to users
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'USER');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER'`);

        // Subscriptions status enum
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIAL', 'INACTIVE');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Subscriptions table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "subscriptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "abacate_billing_id" character varying,
                "abacate_customer_id" character varying,
                "plan" character varying NOT NULL DEFAULT 'PRO',
                "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'INACTIVE',
                "current_period_end" TIMESTAMP,
                "checkout_url" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_subscriptions_user_id" UNIQUE ("user_id"),
                CONSTRAINT "FK_subscriptions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."subscriptions_status_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP "role"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);
    }
}
