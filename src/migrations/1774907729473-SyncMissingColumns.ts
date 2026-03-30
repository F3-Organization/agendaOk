import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncMissingColumns1774907729473 implements MigrationInterface {
    name = 'SyncMissingColumns1774907729473'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_schedules_user"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_schedules_client"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_clients_user"`);
        await queryRunner.query(`ALTER TABLE "user_configs" DROP CONSTRAINT "FK_user_configs_user"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_user"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP COLUMN "notified_at"`);
        await queryRunner.query(`ALTER TABLE "user_configs" DROP COLUMN "tax_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD CONSTRAINT "FK_55e6651198104efea0b04568a88" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD CONSTRAINT "FK_e2b48c798a6f5d7827dd7d714e8" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_07a7a09b04e7b035c9d90cf4984" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_configs" ADD CONSTRAINT "FK_9ce6a758be9e806ec5b55dd8870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1"`);
        await queryRunner.query(`ALTER TABLE "user_configs" DROP CONSTRAINT "FK_9ce6a758be9e806ec5b55dd8870"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_07a7a09b04e7b035c9d90cf4984"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_e2b48c798a6f5d7827dd7d714e8"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_55e6651198104efea0b04568a88"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
        await queryRunner.query(`ALTER TABLE "user_configs" ADD "tax_id" character varying`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD "notified_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_configs" ADD CONSTRAINT "FK_user_configs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_clients_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD CONSTRAINT "FK_schedules_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD CONSTRAINT "FK_schedules_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
