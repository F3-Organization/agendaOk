import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779077999492 implements MigrationInterface {
    name = 'Migration1779077999492'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'USER', 'PROFESSIONAL', 'ATTENDANT')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying NOT NULL, "name" character varying NOT NULL, "password" character varying, "google_id" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "two_factor_enabled" boolean NOT NULL DEFAULT false, "two_factor_secret" character varying, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE ("google_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "owner_id" uuid NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, CONSTRAINT "UQ_b28b07d25e4324eee577de5496d" UNIQUE ("slug"), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "company_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "whatsapp_number" character varying, "whatsapp_instance_name" character varying, "whatsapp_instance_token" character varying, "whatsapp_lid" character varying, "last_message_id" character varying, "tax_id" character varying, "billing_customer_id" character varying, "silent_window_start" character varying NOT NULL DEFAULT '22:00', "silent_window_end" character varying NOT NULL DEFAULT '08:00', "business_type" character varying, "business_description" text, "bot_greeting" text, "bot_instructions" text, "address" character varying, "working_hours" jsonb, "services_offered" jsonb, "bot_enabled" boolean NOT NULL DEFAULT false, "locale" character varying, CONSTRAINT "UQ_210a999928c188ba9191e11bd47" UNIQUE ("company_id"), CONSTRAINT "REL_210a999928c188ba9191e11bd4" UNIQUE ("company_id"), CONSTRAINT "PK_726c503e5e9ae894378b0977353" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "email" character varying, "phone" character varying NOT NULL, "company_id" uuid NOT NULL, CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_98b4e6b67cd674e2acae2de946" ON "clients" ("company_id", "phone") `);
        await queryRunner.query(`CREATE TABLE "professionals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "user_id" uuid, "invited_email" character varying, "name" character varying NOT NULL, "specialty" character varying, "working_hours" jsonb, "appointment_duration" integer NOT NULL DEFAULT '60', "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_d7dc8473b49fcd938def2799387" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_028da646fe973446d3045f35a1" ON "professionals" ("company_id") `);
        await queryRunner.query(`CREATE TYPE "public"."schedules_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "professional_id" uuid, "client_name" character varying NOT NULL, "client_phone" character varying NOT NULL, "title" character varying NOT NULL, "start_at" TIMESTAMP NOT NULL, "end_at" TIMESTAMP, "status" "public"."schedules_status_enum" NOT NULL DEFAULT 'PENDING', "is_notified" boolean NOT NULL DEFAULT false, "notes" text, CONSTRAINT "PK_7e33fc2ea755a5765e3564e66dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_47d3ff6466132753b5d860da21" ON "schedules" ("professional_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_028cc122db7c6d5830acb9ca46" ON "schedules" ("company_id", "client_phone") `);
        await queryRunner.query(`CREATE INDEX "IDX_d441c2e614d594b8cc4b15024a" ON "schedules" ("company_id", "start_at") `);
        await queryRunner.query(`CREATE TABLE "user_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "whatsapp_number" character varying, "whatsapp_instance_name" character varying, "whatsapp_lid" character varying, "last_message_id" character varying, "tax_id" character varying, "billing_customer_id" character varying, "silent_window_start" character varying NOT NULL DEFAULT '22:00', "silent_window_end" character varying NOT NULL DEFAULT '08:00', CONSTRAINT "UQ_9ce6a758be9e806ec5b55dd8870" UNIQUE ("user_id"), CONSTRAINT "REL_9ce6a758be9e806ec5b55dd887" UNIQUE ("user_id"), CONSTRAINT "PK_fc11c8861af6469fbd8920e9f80" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payment_methods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "code" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(255), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_f8aad3eab194dfdae604ca11125" UNIQUE ("code"), CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f8aad3eab194dfdae604ca1112" ON "payment_methods" ("code") `);
        await queryRunner.query(`CREATE TYPE "public"."subscription_payments_status_enum" AS ENUM('PENDING', 'PAID', 'CANCELLED', 'REFUNDED', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "subscription_payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "subscription_id" uuid NOT NULL, "status" "public"."subscription_payments_status_enum" NOT NULL DEFAULT 'PENDING', "amount" integer NOT NULL, "billing_id" character varying NOT NULL, "checkout_url" text NOT NULL, "paid_at" TIMESTAMP, "payment_method_id" uuid, CONSTRAINT "PK_1b7a76365fd477de59cba0ab957" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3d76b7ca2d964925a54ad9fd51" ON "subscription_payments" ("subscription_id") `);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIAL', 'INACTIVE', 'PENDING')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "abacate_billing_id" character varying, "abacate_customer_id" character varying, "plan" character varying NOT NULL DEFAULT 'FREE', "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'ACTIVE', "current_period_end" TIMESTAMP, "checkout_url" text, CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d0a95ef8a28188364c546eb65c" ON "subscriptions" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "price_in_cents" integer NOT NULL DEFAULT '0', "message_limit" integer, "max_devices" integer NOT NULL DEFAULT '1', "features" jsonb NOT NULL DEFAULT '[]', "is_active" boolean NOT NULL DEFAULT true, "is_purchasable" boolean NOT NULL DEFAULT false, "sort_order" integer NOT NULL DEFAULT '0', "gateway_product_id" character varying, CONSTRAINT "UQ_e7b71bb444e74ee067df057397e" UNIQUE ("slug"), CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "webhook_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "event_type" character varying(100) NOT NULL, "billing_id" character varying(255), "user_id" character varying(255), "payment_method_code" character varying(50), "amount" integer, "raw_payload" jsonb NOT NULL, "processed_at" TIMESTAMP, "error" text, CONSTRAINT "PK_a618f42174b80b63ba995de477e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_777544ec3a31f9e1c43e73c6cd" ON "webhook_audit_logs" ("event_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_58fdd321b47bea96a85357f325" ON "webhook_audit_logs" ("billing_id") `);
        await queryRunner.query(`CREATE TYPE "public"."company_members_role_enum" AS ENUM('ATTENDANT')`);
        await queryRunner.query(`CREATE TABLE "company_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "user_id" uuid, "invited_email" character varying, "role" "public"."company_members_role_enum" NOT NULL DEFAULT 'ATTENDANT', CONSTRAINT "PK_b159163d9222448886158bc5385" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6e865dcafa308a5a7825d8de5c" ON "company_members" ("company_id", "user_id") `);
        await queryRunner.query(`CREATE TABLE "leads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "source" character varying NOT NULL DEFAULT 'landing', CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b3eea7add0e16594dba102716c" ON "leads" ("email") `);
        await queryRunner.query(`ALTER TABLE "companies" ADD CONSTRAINT "FK_df63e1563bbd91b428b5c50d8ad" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_configs" ADD CONSTRAINT "FK_210a999928c188ba9191e11bd47" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_fcadfe25d85cf21251273169128" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "professionals" ADD CONSTRAINT "FK_028da646fe973446d3045f35a15" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD CONSTRAINT "FK_4312587691718bbddaf92b4c866" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD CONSTRAINT "FK_47d3ff6466132753b5d860da210" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_configs" ADD CONSTRAINT "FK_9ce6a758be9e806ec5b55dd8870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription_payments" ADD CONSTRAINT "FK_3d76b7ca2d964925a54ad9fd516" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription_payments" ADD CONSTRAINT "FK_53a1780c4173944a643db1199e0" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_members" ADD CONSTRAINT "FK_e33a61fd560f6412d3ffb39f225" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company_members" DROP CONSTRAINT "FK_e33a61fd560f6412d3ffb39f225"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1"`);
        await queryRunner.query(`ALTER TABLE "subscription_payments" DROP CONSTRAINT "FK_53a1780c4173944a643db1199e0"`);
        await queryRunner.query(`ALTER TABLE "subscription_payments" DROP CONSTRAINT "FK_3d76b7ca2d964925a54ad9fd516"`);
        await queryRunner.query(`ALTER TABLE "user_configs" DROP CONSTRAINT "FK_9ce6a758be9e806ec5b55dd8870"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_47d3ff6466132753b5d860da210"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_4312587691718bbddaf92b4c866"`);
        await queryRunner.query(`ALTER TABLE "professionals" DROP CONSTRAINT "FK_028da646fe973446d3045f35a15"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_fcadfe25d85cf21251273169128"`);
        await queryRunner.query(`ALTER TABLE "company_configs" DROP CONSTRAINT "FK_210a999928c188ba9191e11bd47"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "FK_df63e1563bbd91b428b5c50d8ad"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b3eea7add0e16594dba102716c"`);
        await queryRunner.query(`DROP TABLE "leads"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6e865dcafa308a5a7825d8de5c"`);
        await queryRunner.query(`DROP TABLE "company_members"`);
        await queryRunner.query(`DROP TYPE "public"."company_members_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_58fdd321b47bea96a85357f325"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_777544ec3a31f9e1c43e73c6cd"`);
        await queryRunner.query(`DROP TABLE "webhook_audit_logs"`);
        await queryRunner.query(`DROP TABLE "plans"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d0a95ef8a28188364c546eb65c"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3d76b7ca2d964925a54ad9fd51"`);
        await queryRunner.query(`DROP TABLE "subscription_payments"`);
        await queryRunner.query(`DROP TYPE "public"."subscription_payments_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f8aad3eab194dfdae604ca1112"`);
        await queryRunner.query(`DROP TABLE "payment_methods"`);
        await queryRunner.query(`DROP TABLE "user_configs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d441c2e614d594b8cc4b15024a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_028cc122db7c6d5830acb9ca46"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_47d3ff6466132753b5d860da21"`);
        await queryRunner.query(`DROP TABLE "schedules"`);
        await queryRunner.query(`DROP TYPE "public"."schedules_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_028da646fe973446d3045f35a1"`);
        await queryRunner.query(`DROP TABLE "professionals"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_98b4e6b67cd674e2acae2de946"`);
        await queryRunner.query(`DROP TABLE "clients"`);
        await queryRunner.query(`DROP TABLE "company_configs"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
