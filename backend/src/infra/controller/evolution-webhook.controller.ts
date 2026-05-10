import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { HandleEvolutionWebhookUseCase } from "../../usecase/notification/handle-evolution-webhook.usecase";
import { ICompanyConfigRepository } from "../../usecase/repositories/icompany-config-repository";
import { EvolutionWebhookSchema } from "../../../../shared/schemas/evolution.schema";
import { decrypt } from "../../shared/utils/cryptography";
import { evolutionWebhookSchema } from "./schemas/webhook.swagger";

export class EvolutionWebhookController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly handleWebhook: HandleEvolutionWebhookUseCase,
        private readonly companyConfigRepository: ICompanyConfigRepository
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
                const config = await this.companyConfigRepository.findByInstanceName(payload.instance);
                if (!config?.whatsappInstanceToken) {
                    this.fastify.logInfo("[EvolutionWebhookController] No config/token found for instance", { instance: payload.instance });
                    return reply.code(401).send({ error: "Unauthorized webhook call" });
                }

                const storedToken = decrypt(config.whatsappInstanceToken);
                if (payload.apikey !== storedToken) {
                    this.fastify.logInfo("[EvolutionWebhookController] Token mismatch", { instance: payload.instance });
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
        }, evolutionWebhookSchema);
    }
}
