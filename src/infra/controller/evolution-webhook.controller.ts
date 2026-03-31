import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { HandleEvolutionWebhookUseCase } from "../../usecase/notification/handle-evolution-webhook.usecase";
import { env } from "../config/configs";
import { EvolutionWebhookSchema } from "../../../shared/schemas/evolution.schema";

export class EvolutionWebhookController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly handleWebhook: HandleEvolutionWebhookUseCase
    ) {
        this.fastify.logInfo("[EvolutionWebhookController] Initializing...");
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.addRoute("POST", "/webhook/evolution", async (request: FastifyRequest, reply: FastifyReply) => {
            this.fastify.logInfo("[EvolutionWebhookController] Webhook Body", { 
                body: request.body
            });

            const parseResult = EvolutionWebhookSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ 
                    error: "Invalid payload", 
                    details: parseResult.error.format() 
                });
            }

            const payload = parseResult.data;
            
            try {
                // Verify apikey in production
                if (env.isProduction() && payload.apikey !== env.evolution.apiKey) {
                    return reply.code(401).send({ error: "Unauthorized webhook call" });
                }

                // Processamento assíncrono para não travar o webhook
                this.handleWebhook.execute(payload).catch(err => {
                    this.fastify.logInfo("[EvolutionWebhookController] Async processing failed", { error: err.message });
                });

                reply.send({ status: "received" });
            } catch (error: any) {
                this.fastify.logInfo("[EvolutionWebhookController] Webhook internal error", { error: error.message });
                reply.code(500).send({ error: "Webhook processing error" });
            }
        }, {
            tags: ["Webhook"],
            summary: "Receives notifications from the Evolution API",
            description: "Main endpoint for receiving webhooks from the Evolution API.",
            body: {
                type: "object",
                required: ["event", "instance"],
                properties: {
                    event: { type: "string" },
                    instance: { type: "string" },
                    data: { type: "object" },
                    sender: { type: "string" },
                    apikey: { type: "string" }
                }
            },
            response: {
                200: {
                    type: "object",
                    properties: { status: { type: "string" } }
                }
            }

        });
    }
}
