import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { HandleEvolutionWebhookUseCase } from "../../usecase/notification/handle-evolution-webhook.usecase";

export class EvolutionWebhookController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly handleWebhook: HandleEvolutionWebhookUseCase
    ) {
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.addRoute("POST", "/webhook/evolution", async (request, reply) => {
            const payload = request.body;
            
            try {
                // Processamento assíncrono para não travar o webhook
                this.handleWebhook.execute(payload).catch(err => {
                    console.error("[WebhookController] Async processing failed:", err);
                });

                reply.send({ status: "received" });
            } catch (error: any) {
                console.error("[WebhookController] Webhook registration failed:", error);
                reply.code(500).send({ error: "Webhook processing error" });
            }
        });
    }
}
