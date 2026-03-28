import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { CreateSubscriptionCheckoutUseCase } from "../../usecase/subscription/create-checkout.usecase";
import { HandleAbacatePayWebhookUseCase } from "../../usecase/subscription/handle-abacate-webhook.usecase";
import { SubscriptionRepository } from "../database/repositories/subscription.repository";
import { SubscriptionStatus } from "../database/entities/subscription.entity";

export class SubscriptionController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly createCheckout: CreateSubscriptionCheckoutUseCase,
        private readonly handleWebhook: HandleAbacatePayWebhookUseCase,
        private readonly subscriptionRepo: SubscriptionRepository
    ) {
        this.registerRoutes();
    }

    private registerRoutes() {
        // 1. Criar Checkout de Assinatura
        this.fastify.addProtectedRoute("POST", "/subscription/checkout", async (request, reply) => {
            const userId = (request.user as any).id;
            try {
                const result = await this.createCheckout.execute(userId);
                reply.send(result);
            } catch (error: any) {
                console.error("[SubscriptionController] Checkout failed:", error);
                reply.code(500).send({ error: "Erro ao criar checkout", message: error.message });
            }
        }, {
            tags: ["Subscription"],
            summary: "Cria um link de pagamento para assinatura PRO",
            description: "Registra o usuário no Abacate Pay e retorna uma URL para pagamento via PIX ou Cartão.",
            response: {
                200: {
                    type: 'object',
                    properties: {
                        url: { type: 'string' }
                    }
                }
            }
        });

        // 2. Ver Status da Assinatura
        this.fastify.addProtectedRoute("GET", "/subscription/status", async (request, reply) => {
            const userId = (request.user as any).id;
            const subscription = await this.subscriptionRepo.findByUserId(userId);

            if (!subscription) {
                return reply.send({ status: SubscriptionStatus.INACTIVE, plan: "FREE" });
            }

            reply.send({
                status: subscription.status,
                plan: subscription.plan,
                currentPeriodEnd: subscription.currentPeriodEnd,
                checkoutUrl: subscription.checkoutUrl
            });
        }, {
            tags: ["Subscription"],
            summary: "Obtém o status atual da assinatura do usuário",
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        plan: { type: 'string' },
                        currentPeriodEnd: { type: 'string', format: 'date-time' },
                        checkoutUrl: { type: 'string' }
                    }
                }
            }
        });

        // 3. Webhook do Abacate Pay (Público)
        this.fastify.addRoute("POST", "/webhook/abacatepay", async (request, reply) => {
            // TODO: Adicionar validação de assinatura HMAC do Abacate Pay se disponível
            const payload = request.body;
            try {
                await this.handleWebhook.execute(payload);
                reply.send({ status: "processed" });
            } catch (error: any) {
                console.error("[SubscriptionController] Webhook processing failed:", error);
                reply.code(500).send({ error: "Webhook processing error" });
            }
        }, {
            tags: ["Webhook"],
            summary: "Receptor de eventos do Abacate Pay",
            description: "Endpoint público para notificações automáticas de pagamento e atualizações de cobrança.",
            response: {
                200: { type: 'object', properties: { status: { type: 'string' } } }
            }
        });
    }
}
