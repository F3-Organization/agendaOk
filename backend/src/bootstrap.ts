import { AppDataSource } from "./infra/config/data-source";
import { factory } from "./infra/factory/factory";
import { env } from "./infra/config/configs";
import { seedPaymentMethods } from "./infra/database/seeders/payment-methods.seed";
import { seedPlansIfEmpty } from "./infra/database/seeders/plans.seed";

function validateEnv() {
    const required: Array<[string, unknown]> = [
        ["JWT_SECRET", env.jwt.secret],
        ["DB_PASSWORD", env.database.password],
        ["EVO_API_KEY", env.evolution.apiKey],
    ];

    if (env.isProduction()) {
        required.push(
            ["ENCRYPTION_KEY", env.security.encryptionKey],
            ["ABACATE_WEBHOOK_SECRET", env.abacatePay.webhookSecret],
            ["GOOGLE_CLIENT_ID", env.google.clientId],
            ["GOOGLE_CLIENT_SECRET", env.google.clientSecret],
        );
    }

    const missing = required.filter(([, v]) => !v).map(([k]) => k);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
}

async function bootstrap() {
    try {
        validateEnv();

        await AppDataSource.initialize();
        await seedPlansIfEmpty();
        await seedPaymentMethods();

        const adapter = factory.adapters.fastify();
        await adapter.setup();

        factory.controller.app();
        factory.controller.auth();
        factory.controller.company();
        factory.controller.appointment();
        factory.controller.webhook();
        factory.controller.subscription();
        factory.controller.whatsapp();
        factory.controller.dashboard();
        factory.controller.user();
        factory.controller.professional();
        factory.controller.admin();

        factory.workers.notify();
        factory.workers.subscription();

        await adapter.listen();

    } catch (err) {
        console.error("[Bootstrap] Critical error during initialization:", err);
        process.exit(1);
    }
}

bootstrap();
