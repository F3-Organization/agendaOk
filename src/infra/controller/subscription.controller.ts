import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { CreateSubscriptionCheckoutUseCase } from "../../usecase/subscription/create-checkout.usecase";
import { HandleAbacatePayWebhookUseCase } from "../../usecase/subscription/handle-abacate-webhook.usecase";
import { GetSubscriptionStatusUseCase } from "../../usecase/subscription/get-subscription-status.usecase";
import { GetSubscriptionPaymentHistoryUseCase } from "../../usecase/subscription/get-payment-history.usecase";
import { GenerateInvoicePdfUseCase } from "../../usecase/subscription/generate-invoice-pdf.usecase";
import { IPlanRepository } from "../../usecase/repositories/iplan-repository";
import { PaymentMethodRepository } from "../database/repositories/payment-method.repository";
import { AuthUserPayload } from "../types/auth.types";
import { env } from "../config/configs";
import { createHmac } from "crypto";
import { z } from "zod";

export class SubscriptionController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly createCheckout: CreateSubscriptionCheckoutUseCase,
        private readonly handleWebhook: HandleAbacatePayWebhookUseCase,
        private readonly getStatus: GetSubscriptionStatusUseCase,
        private readonly getHistory: GetSubscriptionPaymentHistoryUseCase,
        private readonly generatePdf: GenerateInvoicePdfUseCase,
        private readonly planRepository: IPlanRepository,
        private readonly paymentMethodRepository: PaymentMethodRepository
    ) {
        this.fastify.logInfo("[SubscriptionController] Initializing...");
        this.registerRoutes();
    }

    private registerRoutes() {
        // 0. Listar Planos (público)
        this.fastify.addRoute("GET", "/subscription/plans", async (_request: FastifyRequest, reply: FastifyReply) => {
            try {
                const plans = await this.planRepository.findActive();
                reply.send(plans);
            } catch (error: any) {
                reply.code(500).send({ error: "Failed to fetch plans" });
            }
        }, {
            tags: ["Subscription"],
            summary: "Lists all active plans",
            response: {
                200: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            slug: { type: "string" },
                            name: { type: "string" },
                            description: { type: "string", nullable: true },
                            priceInCents: { type: "number" },
                            messageLimit: { type: "number", nullable: true },
                            maxDevices: { type: "number" },
                            features: { type: "array", items: { type: "string" } },
                            isPurchasable: { type: "boolean" },
                            sortOrder: { type: "number" }
                        }
                    }
                }
            }
        });

        // 1. Listar Métodos de Pagamento (público)
        this.fastify.addRoute("GET", "/subscription/payment-methods", async (_request: FastifyRequest, reply: FastifyReply) => {
            try {
                const methods = await this.paymentMethodRepository.findAll();
                reply.send(methods);
            } catch (error: any) {
                reply.code(500).send({ error: "Failed to fetch payment methods" });
            }
        }, {
            tags: ["Subscription"],
            summary: "Lists all active payment methods",
            response: {
                200: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            code: { type: "string" },
                            name: { type: "string" },
                            description: { type: "string", nullable: true },
                            isActive: { type: "boolean" }
                        }
                    }
                }
            }
        });

        // 3. Criar Checkout de Assinatura
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
            response: {
                200: { 
                    type: "object", 
                    properties: { 
                        url: { type: "string" },
                        planName: { type: "string" },
                        amount: { type: "number" }
                    } 
                },
                500: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } }
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
                        checkoutUrl: { type: "string" },
                        amount: { type: "number" },
                        planName: { type: "string" },
                        taxId: { type: "string", nullable: true },
                        whatsappNumber: { type: "string", nullable: true }
                    }
                },
                500: { type: "object", properties: { error: { type: "string" } } }
            }
        });

        // 3. Histórico de Pagamentos
        this.fastify.addProtectedRoute("GET", "/subscription/payments", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const userId = user.id;

            try {
                const history = await this.getHistory.execute(userId);
                reply.send(history);
            } catch (error: any) {
                this.fastify.logInfo("[SubscriptionController] Failed to get history", { error: error.message });
                reply.code(500).send({ error: "History retrieval failed" });
            }
        }, {
            tags: ["Subscription"],
            summary: "Gets the payment history of the user's subscription",
            response: {
                200: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            status: { type: "string" },
                            amount: { type: "number" },
                            paidAt: { type: "string", format: "date-time", nullable: true },
                            createdAt: { type: "string", format: "date-time" },
                            checkoutUrl: { type: "string" },
                            paymentMethod: { type: "string", nullable: true }
                        }
                    }
                },
                500: { type: "object", properties: { error: { type: "string" } } }
            }
        });

        // 4. Download PDF da Fatura
        this.fastify.addProtectedRoute("GET", "/subscription/payments/:id/pdf", async (request: FastifyRequest, reply: FastifyReply) => {
            const params = request.params as { id: string };
            const user = request.user as AuthUserPayload;
            const userId = user.id;

            try {
                const pdfBuffer = await this.generatePdf.execute(params.id, userId);
                reply.type("application/pdf")
                     .header("Content-Disposition", `attachment; filename=invoice-${params.id}.pdf`)
                     .send(pdfBuffer);
            } catch (error: any) {
                this.fastify.logInfo("[SubscriptionController] PDF generation failed", { error: error.message });
                reply.code(500).send({ error: "PDF generation failed" });
            }
        }, {
            tags: ["Subscription"],
            summary: "Downloads a PDF invoice for a specific payment",
            response: {
                200: { type: "string", format: "binary" },
                500: { type: "object", properties: { error: { type: "string" } } }
            }
        });

        // 5. Webhook do Abacate Pay (Público)
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

            if (env.isProduction() && !env.abacatePay.webhookSecret) {
                this.fastify.logInfo("[SubscriptionController] ABACATE_WEBHOOK_SECRET not configured in production");
                return reply.code(503).send({ error: "Webhook not configured" });
            }

            if (env.abacatePay.webhookSecret) {
                if (!signature) {
                    return reply.code(401).send({ error: "Missing signature" });
                }

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
            body: {
                type: "object",
                required: ["event", "data"],
                properties: {
                    event: { type: "string" },
                    data: { type: "object", required: ["id"], properties: { id: { type: "string" } } }
                }
            },
            response: {
                200: { type: "object", properties: { status: { type: "string" } } },
                401: { type: "object", properties: { error: { type: "string" } } }
            }
        });
    }
}
