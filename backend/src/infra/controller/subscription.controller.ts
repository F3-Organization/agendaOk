import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { CreateSubscriptionCheckoutUseCase } from "../../usecase/subscription/create-checkout.usecase";
import { HandleAbacatePayWebhookUseCase } from "../../usecase/subscription/handle-abacate-webhook.usecase";
import { GetSubscriptionStatusUseCase } from "../../usecase/subscription/get-subscription-status.usecase";
import { GetSubscriptionPaymentHistoryUseCase } from "../../usecase/subscription/get-payment-history.usecase";
import { GenerateInvoicePdfUseCase } from "../../usecase/subscription/generate-invoice-pdf.usecase";
import { CreateTransparentPixUseCase } from "../../usecase/subscription/create-transparent-pix.usecase";
import { CancelSubscriptionUseCase } from "../../usecase/subscription/cancel-subscription.usecase";
import { IPaymentGateway } from "../../usecase/ports/ipayment-gateway";
import { IPlanRepository } from "../../usecase/repositories/iplan-repository";
import { PaymentMethodRepository } from "../database/repositories/payment-method.repository";
import { AuthUserPayload } from "../types/auth.types";
import { ownerOnlyMiddleware } from "../middleware/owner-only.middleware";
import { env } from "../config/configs";
import { createHmac } from "crypto";
import { z } from "zod";
import {
    listPlansSchema,
    listPaymentMethodsSchema,
    createCheckoutSchema,
    createPixSchema,
    getPixStatusSchema,
    cancelSubscriptionSchema,
    getSubscriptionStatusSchema,
    getPaymentHistorySchema,
    downloadInvoicePdfSchema,
    abacatePayWebhookSchema
} from "./schemas/subscription.swagger";

export class SubscriptionController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly createCheckout: CreateSubscriptionCheckoutUseCase,
        private readonly handleWebhook: HandleAbacatePayWebhookUseCase,
        private readonly getStatus: GetSubscriptionStatusUseCase,
        private readonly getHistory: GetSubscriptionPaymentHistoryUseCase,
        private readonly generatePdf: GenerateInvoicePdfUseCase,
        private readonly planRepository: IPlanRepository,
        private readonly paymentMethodRepository: PaymentMethodRepository,
        private readonly createPixUseCase: CreateTransparentPixUseCase,
        private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
        private readonly paymentGateway: IPaymentGateway
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
        }, listPlansSchema);

        // 1. Listar Métodos de Pagamento (público)
        this.fastify.addRoute("GET", "/subscription/payment-methods", async (_request: FastifyRequest, reply: FastifyReply) => {
            try {
                const methods = await this.paymentMethodRepository.findAll();
                reply.send(methods);
            } catch (error: any) {
                reply.code(500).send({ error: "Failed to fetch payment methods" });
            }
        }, listPaymentMethodsSchema);

        // 2. Criar Checkout de Assinatura
        this.fastify.addProtectedRoute("POST", "/subscription/checkout", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const userId = user.id;

            try {
                const result = await this.createCheckout.execute(userId, (request as any).locale);
                reply.send(result);
            } catch (error: any) {
                this.fastify.logInfo("[SubscriptionController] Checkout failed", { error: error.message });
                reply.code(500).send({ error: "Checkout creation failed", message: error.message });
            }
        }, createCheckoutSchema, ownerOnlyMiddleware);

        // 3. Ver Status da Assinatura
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
        }, getSubscriptionStatusSchema, ownerOnlyMiddleware);

        // 4. Histórico de Pagamentos
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
        }, getPaymentHistorySchema, ownerOnlyMiddleware);

        // 5. Download PDF da Fatura
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
        }, downloadInvoicePdfSchema, ownerOnlyMiddleware);

        // 6. Criar PIX Transparente (checkout inline)
        this.fastify.addProtectedRoute("POST", "/subscription/pix", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            try {
                const result = await this.createPixUseCase.execute(user.id, (request as any).locale);
                reply.send(result);
            } catch (error: any) {
                reply.code(400).send({ error: "PIX creation failed", message: error.message });
            }
        }, createPixSchema, ownerOnlyMiddleware);

        // 7. Verificar status do PIX
        this.fastify.addProtectedRoute("GET", "/subscription/pix/:id/status", async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as { id: string };
            try {
                const status = await this.paymentGateway.getTransparentPix(id);
                reply.send(status ?? { id, status: "UNKNOWN" });
            } catch {
                reply.code(500).send({ error: "Status check failed" });
            }
        }, getPixStatusSchema, ownerOnlyMiddleware);

        // 8. Cancelar Assinatura
        this.fastify.addProtectedRoute("POST", "/subscription/cancel", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            try {
                await this.cancelSubscriptionUseCase.execute(user.id, (request as any).locale);
                reply.send({ status: "cancelled" });
            } catch (error: any) {
                reply.code(400).send({ error: "Cancellation failed", message: error.message });
            }
        }, cancelSubscriptionSchema, ownerOnlyMiddleware);

        // 9. Webhook do Abacate Pay (Público)
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
                // Return 200 — audit log already saved, gateway should not retry failed business logic
                reply.send({ status: "received", warning: "processing_error" });
            }
        }, abacatePayWebhookSchema);
    }
}
