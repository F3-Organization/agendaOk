import { AppDataSource } from "./infra/config/data-source";
import { factory } from "./infra/factory/factory";

async function bootstrap() {
    try {
        // 1. Initialize Database
        await AppDataSource.initialize();
        console.log("[Bootstrap] Data Source has been initialized!");

        // 2. Setup API Adapter (Swagger, etc.)
        const adapter = factory.adapters.fastify();
        await adapter.setup();
        console.log("[Bootstrap] Fastify Adapter setup complete.");

        // 3. Initialize Controllers (Register Routes)
        // Note: These must be called AFTER adapter.setup() to ensure decorations are ready
        console.log("[Bootstrap] Registering controllers...");
        factory.controller.app();
        factory.controller.auth();
        factory.controller.calendar();
        factory.controller.webhook();
        factory.controller.subscription();
        factory.controller.whatsapp();
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
