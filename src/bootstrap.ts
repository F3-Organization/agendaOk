import { AppDataSource } from "./infra/config/data-source";
import { factory } from "./infra/factory/factory";

async function bootstrap() {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");

        // 1. Setup adapter (Swagger, etc.)
        const adapter = factory.adapters.fastify();
        await adapter.setup();

        // 2. Initialize controllers (which register routes)
        factory.controller.app();
        factory.controller.auth();
        factory.controller.calendar();
        factory.controller.webhook();
        factory.controller.subscription();

        // Start workers
        factory.queues.sync();
        factory.queues.notify();

        // Start the server
        adapter.listen();
    } catch (err) {
        console.error("Error during Data Source initialization", err);
        process.exit(1);
    }
}

bootstrap();
