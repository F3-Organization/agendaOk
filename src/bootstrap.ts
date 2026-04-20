import { AppDataSource } from "./infra/config/data-source";
import { factory } from "./infra/factory/factory";
import { env } from "./infra/config/configs";
import { Plan } from "./infra/database/entities/plan.entity";

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

async function seedPlansIfEmpty() {
    const planRepo = AppDataSource.getRepository(Plan);
    const count = await planRepo.count();
    if (count > 0) return;

    await planRepo.save([
        {
            slug: "FREE",
            name: "ConfirmaZap Free",
            description: "Plano gratuito para começar a usar o ConfirmaZap.",
            priceInCents: 0,
            messageLimit: 50,
            maxDevices: 1,
            features: ["50 confirmações/mês", "1 dispositivo WhatsApp", "Suporte por email", "Relatórios básicos"],
            isActive: true,
            isPurchasable: false,
            sortOrder: 0,
        },
        {
            slug: "PRO",
            name: "ConfirmaZap Pro",
            description: "Plano profissional com confirmações ilimitadas e recursos avançados.",
            priceInCents: 4990,
            messageLimit: null,
            maxDevices: 3,
            features: ["Confirmações ilimitadas", "3 dispositivos WhatsApp", "Suporte prioritário", "Acesso à API", "Sem marca d'água"],
            isActive: true,
            isPurchasable: true,
            sortOrder: 1,
        },
    ]);
    console.log("[Bootstrap] Plans seeded successfully.");
}

async function bootstrap() {
    try {
        // 1. Validate required env vars before doing anything
        validateEnv();

        // 2. Initialize Database
        await AppDataSource.initialize();
        console.log("[Bootstrap] Data Source has been initialized!");
        await seedPlansIfEmpty();

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
