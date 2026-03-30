import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncMissingColumns1711900000000 implements MigrationInterface {
    name = 'SyncMissingColumns1711900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Schedule table additions
        await queryRunner.query(`ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "attendees" jsonb`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "is_notified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "notified_at" TIMESTAMP`);
        
        // UserConfig table additions
        await queryRunner.query(`ALTER TABLE "user_configs" ADD COLUMN IF NOT EXISTS "tax_id" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_configs" DROP COLUMN IF EXISTS "tax_id"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP COLUMN IF EXISTS "notified_at"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP COLUMN IF EXISTS "is_notified"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP COLUMN IF EXISTS "attendees"`);
    }
}
