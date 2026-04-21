import { AppDataSource } from "./infra/config/data-source";
import { factory } from "./infra/factory/factory";
import { env } from "./infra/config/configs";
import { Plan } from "./infra/database/entities/plan.entity";
import { PaymentMethod } from "./infra/database/entities/payment-method.entity";
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
        // 1. Validate required env vars before doing anything
        validateEnv();

        // 2. Initialize Database
        await AppDataSource.initialize();
        console.log("[Bootstrap] Data Source has been initialized!");
        await seedPlansIfEmpty();
        await seedPaymentMethods();

        // 3. Setup API Adapter (Swagger, etc.)
        const adapter = factory.adapters.fastify();
        await adapter.setup();
        console.log("[Bootstrap] Fastify Adapter setup complete.");

        // 3. Initialize Controllers (Register Routes)
        // Note: These must be called AFTER adapter.setup() to ensure decorations are ready
        console.log("[Bootstrap] Registering controllers...");
        factory.controller.app();
        factory.controller.auth();
        factory.controller.company();
        factory.controller.calendar();
        factory.controller.webhook();
        factory.controller.subscription();
        factory.controller.whatsapp();
        factory.controller.dashboard();
        factory.controller.user();
        factory.controller.professional();
        factory.controller.admin();
        console.log("[Bootstrap] Controllers and routes registered.");


        // 4. Start Background Workers
        // We call the worker factory methods to instantiate the bullmq workers
        factory.workers.sync();
        factory.workers.notify();
        console.log("[Bootstrap] Background workers started.");

        // 5. Start the server
        await adapter.listen();
        console.log("[Bootstrap] Server is listening...");

    } catch (err) {
        console.error("[Bootstrap] Critical error during initialization:", err);
        process.exit(1);
    }
}

bootstrap();
