import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { CreateSubscriptionCheckoutUseCase } from "../../usecase/subscription/create-checkout.usecase";
import { HandleAbacatePayWebhookUseCase } from "../../usecase/subscription/handle-abacate-webhook.usecase";
import { GetSubscriptionStatusUseCase } from "../../usecase/subscription/get-subscription-status.usecase";
import { AuthUserPayload } from "../types/auth.types";
import { env } from "../config/configs";
import { createHmac } from "crypto";
import { z } from "zod";

export class SubscriptionController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly createCheckout: CreateSubscriptionCheckoutUseCase,
        private readonly handleWebhook: HandleAbacatePayWebhookUseCase,
        private readonly getStatus: GetSubscriptionStatusUseCase
    ) {
        this.fastify.logInfo("[SubscriptionController] Initializing...");
        this.registerRoutes();
    }

    private registerRoutes() {
        // 1. Criar Checkout de Assinatura
        this.fastify.addProtectedRoute("POST", "/subscription/checkout", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const userId = user.id;

            try {
                const result = await this.createCheckout.execute(userId);
                reply.send(result);
            } catch (error: any) {
                this.fastify.logInfo("[SubscriptionController] Checkout failed", { error: error.message });
                reply.code(500).send({ error: "Checkout creation failed", message: error.message });
            }
        }, {
            tags: ["Subscription"],
            summary: "Creates a payment link for PRO subscription",
            description: "Registers the user in Abacate Pay and returns a payment URL for PIX or Credit Card.",
            response: {
                200: {
                    type: "object",
                    properties: {
                        url: { type: "string" }
                    }
                },
                500: {
                    type: "object",
                    properties: {
                        error: { type: "string" },
                        message: { type: "string" }
                    }
                }
            }

        });

        // 2. Ver Status da Assinatura
        this.fastify.addProtectedRoute("GET", "/subscription/status", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const userId = user.id;

            try {
                const status = await this.getStatus.execute(userId);
                reply.send(status);
            } catch (error: any) {
                this.fastify.logInfo("[SubscriptionController] Failed to get status", { error: error.message });
                reply.code(500).send({ error: "Status retrieval failed" });
            }
        }, {
            tags: ["Subscription"],
            summary: "Gets the current subscription status of the user",
            response: {
                200: {
                    type: "object",
                    properties: {
                        status: { type: "string", enum: ["active", "inactive", "pending"] },
                        plan: { type: "string" },
                        currentPeriodEnd: { type: "string", format: "date-time" },
                        checkoutUrl: { type: "string" }
                    }
                },
                500: {
                    type: "object",
                    properties: {
                        error: { type: "string" }
                    }
                }
            }

        });

        // 3. Webhook do Abacate Pay (Público)
        this.fastify.addRoute("POST", "/webhook/abacatepay", async (request: FastifyRequest, reply: FastifyReply) => {
            const signature = request.headers["x-abacatepay-signature"] as string;
            
            const webhookSchema = z.object({
                event: z.string(),
                data: z.object({
                    id: z.string()
                }).passthrough()
            }).passthrough();

            const parseResult = webhookSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Invalid payload", details: parseResult.error.format() });
            }

            const payload = parseResult.data;
            const rawBody = JSON.stringify(request.body);

            if (!signature && env.isProduction()) {
                return reply.code(401).send({ error: "Missing signature" });
            }

            if (env.isProduction() || env.abacatePay.webhookSecret) {
                const hmac = createHmac("sha256", env.abacatePay.webhookSecret);
                const digest = hmac.update(rawBody).digest("hex");

                if (signature !== digest) {
                    this.fastify.logInfo("[SubscriptionController] Invalid HMAC signature");
                    return reply.code(401).send({ error: "Invalid signature" });
                }
            }

            try {
                await this.handleWebhook.execute(payload);
                reply.send({ status: "processed" });
            } catch (error: any) {
                this.fastify.logInfo("[SubscriptionController] Webhook processing failed", { error: error.message });
                reply.code(400).send({ error: "Webhook processing error" });
            }
        }, {
            tags: ["Webhook"],
            summary: "Abacate Pay event receiver",
            description: "Public endpoint for automatic payment notifications and billing updates.",
            body: {
                type: "object",
                required: ["event", "data"],
                properties: {
                    event: { type: "string" },
                    data: { 
                        type: "object",
                        required: ["id"],
                        properties: {
                            id: { type: "string" }
                        }
                    }
                }
            },
            response: {
                200: { 
                    type: "object", 
                    properties: { status: { type: "string" } } 
                },
                401: {
                    type: "object",
                    properties: { error: { type: "string" } }
                }
            }

        });
    }
}
