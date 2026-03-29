import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { CreateSubscriptionCheckoutUseCase } from "../../usecase/subscription/create-checkout.usecase";
import { HandleAbacatePayWebhookUseCase } from "../../usecase/subscription/handle-abacate-webhook.usecase";
import { SubscriptionRepository } from "../database/repositories/subscription.repository";
import { SubscriptionStatus } from "../database/entities/subscription.entity";
import { env } from "../config/configs";
import { createHmac } from "crypto";

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
                reply.code(500).send({ error: "Checkout creation failed", message: error.message });
            }
        }, {
            tags: ["Subscription"],
            summary: "Creates a payment link for PRO subscription",
            description: "Registers the user in Abacate Pay and returns a payment URL for PIX or Credit Card.",
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
            summary: "Gets the current subscription status of the user",
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
            const signature = request.headers["x-abacatepay-signature"] as string;
            const payload = request.body;
            const rawBody = JSON.stringify(payload);

            if (!signature && env.isProduction()) {
                return reply.code(401).send({ error: "Missing signature" });
            }

            if (env.isProduction() || env.abacatePay.webhookSecret) {
                const hmac = createHmac("sha256", env.abacatePay.webhookSecret);
                const digest = hmac.update(rawBody).digest("hex");

                if (signature !== digest) {
                    console.error("[SubscriptionController] Invalid HMAC signature");
                    return reply.code(401).send({ error: "Invalid signature" });
                }
            }

            try {
                await this.handleWebhook.execute(payload);
                reply.send({ status: "processed" });
            } catch (error: any) {
                console.error("[SubscriptionController] Webhook processing failed:", error);
                reply.code(400).send({ error: "Webhook processing error" });
            }
        }, {
            tags: ["Webhook"],
            summary: "Abacate Pay event receiver",
            description: "Public endpoint for automatic payment notifications and billing updates.",
            response: {
                200: { type: 'object', properties: { status: { type: 'string' } } }
            }
        });
    }
}
