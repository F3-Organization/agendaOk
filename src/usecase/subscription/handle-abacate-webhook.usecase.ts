import { SubscriptionRepository } from "../../infra/database/repositories/subscription.repository";
import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";
import { ISubscriptionPaymentRepository } from "../repositories/isubscription-payment-repository";
import { SubscriptionPaymentStatus } from "../../infra/database/entities/subscription-payment.entity";
import { UserRepository } from "../../infra/database/repositories/user.repository";
import { CompanyConfigRepository } from "../../infra/database/repositories/company-config.repository";
import { SubscriptionNotificationService } from "./subscription-notification.service";
import { FiscalService } from "./fiscal.service";
import { WebhookAuditLog } from "../../infra/database/entities/webhook-audit-log.entity";
import { WebhookAuditLogRepository } from "../../infra/database/repositories/webhook-audit-log.repository";
import { PaymentMethodRepository } from "../../infra/database/repositories/payment-method.repository";
import { PlanRepository } from "../../infra/database/repositories/plan.repository";

export class HandleAbacatePayWebhookUseCase {
    constructor(
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly paymentRepository: ISubscriptionPaymentRepository,
        private readonly userRepository: UserRepository,
        private readonly companyConfigRepository: CompanyConfigRepository,
        private readonly notificationService: SubscriptionNotificationService,
        private readonly fiscalService: FiscalService,
        private readonly auditLogRepository: WebhookAuditLogRepository,
        private readonly paymentMethodRepository: PaymentMethodRepository,
        private readonly planRepository: PlanRepository
    ) {}

    private extractPaymentMethodCode(event: string, data: any): string {
        // v2 webhook doesn't expose the chosen payment method in the payload.
        // Infer from event type and the methods we configure per product type.
        if (
            event === "subscription.completed" ||
            event === "subscription.renewed"
        ) {
            // Subscriptions are created with methods: ["CARD"] only
            return "CREDIT_CARD";
        }

        // For checkout events try to read from payload (v1 compat or future v2 field)
        const raw: string | undefined =
            data?.payment?.method ??
            data?.method ??
            data?.paymentMethod ??
            data?.methods?.[0];

        if (!raw) return "CREDIT_CARD"; // safe default

        const MAP: Record<string, string> = {
            PIX: "PIX",
            CREDIT_CARD: "CREDIT_CARD",
            CREDITCARD: "CREDIT_CARD",
            CREDIT: "CREDIT_CARD",
            DEBIT_CARD: "DEBIT_CARD",
            DEBITCARD: "DEBIT_CARD",
            DEBIT: "DEBIT_CARD",
            CARD: "CREDIT_CARD",
            BOLETO: "BOLETO",
        };
        return MAP[raw.toUpperCase()] ?? raw.toUpperCase();
    }

    async execute(payload: any) {
        const { event, data } = payload;

        // ── Always persist raw event for auditing ────────────────────────
        const methodCode = this.extractPaymentMethodCode(event, data);
        const auditData: Partial<WebhookAuditLog> = {
            eventType: event,
            rawPayload: payload,
        };
        if (data?.id) auditData.billingId = data.id;
        if (methodCode) auditData.paymentMethodCode = methodCode;
        const auditAmount = data?.paidAmount ?? data?.amount ?? data?.payment?.amount;
        if (auditAmount != null) auditData.amount = auditAmount;

        const auditEntry = await this.auditLogRepository.create(auditData);

        try {
            await this.processEvent(event, data, methodCode);
            await this.auditLogRepository.create({
                ...auditEntry,
                processedAt: new Date(),
            });
        } catch (error: any) {
            console.error(`[Webhook] Processing failed for event ${event}:`, error.message);
            // Mark audit entry with error but don't rethrow — already saved above
            throw error;
        }

        return { status: "processed" };
    }

    private async processEvent(event: string, data: any, methodCode: string | undefined) {
        switch (event) {
            // ── Subscription events ──────────────────────────────────────
            case "subscription.completed":   // first payment confirmed
            case "subscription.renewed":     // recurring payment confirmed
                await this.handleBillingPaid(data, methodCode);
                break;

            case "subscription.trial_started":
                await this.handleTrialStarted(data);
                break;

            case "subscription.cancelled":
                await this.handleSubscriptionCancelled(data);
                break;

            case "subscription.refunded":
                await this.handleBillingRefunded(data);
                break;

            // ── Checkout events (one-time) ───────────────────────────────
            case "checkout.completed":
                await this.handleBillingPaid(data, methodCode);
                break;

            case "checkout.refunded":
                await this.handleBillingRefunded(data);
                break;

            case "checkout.disputed":
            case "checkout.lost":
                await this.handleBillingDisputed(event, data);
                break;

            default:
                console.log(`[Webhook] Unhandled event type: ${event}`);
        }
    }

    private async handleBillingPaid(data: any, methodCode: string | undefined) {
        const billingId = data.id;
        const metadata = data.metadata || {};
        const metadataUserId = metadata.userId;

        let subscription = await this.subscriptionRepository.findByBillingId(billingId);

        if (!subscription && metadataUserId) {
            console.log(`[Subscription] Billing ${billingId} not found by ID. Searching by metadata.userId: ${metadataUserId}`);
            subscription = await this.subscriptionRepository.findByUserId(metadataUserId);
        }

        if (!subscription) return;

        // Resolve PaymentMethod FK from code
        let paymentMethodId: string | undefined;
        if (methodCode) {
            const knownMethod = await this.paymentMethodRepository.findByCode(methodCode);
            if (knownMethod) {
                paymentMethodId = knownMethod.id;
            } else {
                console.warn(`[Webhook] Unknown payment method code received: ${methodCode}. Skipping FK assignment.`);
            }
        }

        const methodPatch = paymentMethodId ? { paymentMethodId } : {};

        // v2: paidAmount is the settled value; amount is the total billed
        const paidAmountCents: number | undefined =
            data.paidAmount ?? data.amount ?? data.payment?.amount;

        let payment = await this.paymentRepository.findByBillingId(billingId);
        if (payment) {
            await this.paymentRepository.update(payment.id, {
                status: SubscriptionPaymentStatus.PAID,
                paidAt: new Date(),
                ...(paidAmountCents != null ? { amount: paidAmountCents } : {}),
                ...methodPatch,
            });
        } else {
            console.log(`[Subscription] Creating new payment record for recurring billing ${billingId}`);
            await this.paymentRepository.create({
                subscriptionId: subscription.id,
                billingId,
                amount: paidAmountCents ?? 0,
                status: SubscriptionPaymentStatus.PAID,
                paidAt: new Date(),
                checkoutUrl: data.url || subscription.checkoutUrl,
                ...methodPatch,
            });
        }

        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + 30);

        await this.subscriptionRepository.updateStatus(
            subscription.id,
            subscription.userId,
            SubscriptionStatus.ACTIVE,
            periodEnd,
            subscription.plan
        );

        await this.subscriptionRepository.deactivateOthers(subscription.userId, subscription.id);

        const user = await this.userRepository.findById(subscription.userId);
        const userConfig = await this.companyConfigRepository.findByCompanyId(subscription.userId);

        let nfseEmitted = false;

        if (user && userConfig?.taxId) {
            try {
                // Use actual payment amount; fallback to plan price from DB
                const paidAmountCents = data.paidAmount ?? data.amount ?? data.payment?.amount;
                let valorServicos: number;
                if (paidAmountCents != null) {
                    valorServicos = paidAmountCents / 100;
                } else {
                    const plan = await this.planRepository.findBySlug(subscription.plan);
                    valorServicos = plan ? plan.priceInCents / 100 : 0;
                }

                const nfseResult = await this.fiscalService.emitirNfseAssinatura({
                    referenceId: billingId,
                    tomadorCpfCnpj: userConfig.taxId,
                    tomadorNome: user.name,
                    tomadorEmail: user.email,
                    tomadorEndereco: userConfig.address,
                    valorServicos,
                    planName: subscription.plan,
                });

                nfseEmitted = nfseResult.emitted;
            } catch (error) {
                console.error(`[Fiscal] Failed to issue NFS-e for billing ${billingId}:`, error);
            }
        }

        if (user) {
            await this.notificationService.notifyPaymentSuccess(user.email, user.name, subscription.plan, nfseEmitted);
        }

        console.log(`[Subscription] User ${subscription.userId} activated via Abacate Pay.`);
    }

    private async handleTrialStarted(data: any) {
        const billingId = data.id;
        const subscription = await this.subscriptionRepository.findByBillingId(billingId);

        if (!subscription) return;

        const trialDays = data.trialDays ?? 7;
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + trialDays);

        await this.subscriptionRepository.updateStatus(
            subscription.id,
            subscription.userId,
            SubscriptionStatus.TRIAL,
            periodEnd,
            subscription.plan
        );

        const user = await this.userRepository.findById(subscription.userId);
        if (user) {
            await this.notificationService.notifyPaymentSuccess(user.email, user.name, subscription.plan);
        }

        console.log(`[Subscription] Trial started (${trialDays}d) for user ${subscription.userId}.`);
    }

    private async handleSubscriptionCancelled(data: any) {
        const billingId = data.id;
        const subscription = await this.subscriptionRepository.findByBillingId(billingId);

        if (!subscription) return;

        const payment = await this.paymentRepository.findByBillingId(billingId);
        if (payment) {
            await this.paymentRepository.update(payment.id, {
                status: SubscriptionPaymentStatus.CANCELLED,
            });
        }

        await this.subscriptionRepository.updateStatus(
            subscription.id,
            subscription.userId,
            SubscriptionStatus.CANCELLED
        );

        const user = await this.userRepository.findById(subscription.userId);
        if (user) {
            await this.notificationService.notifySubscriptionExpired(user.email, user.name);
        }

        console.log(`[Subscription] Subscription cancelled for user ${subscription.userId}.`);
    }

    private async handleBillingDisputed(event: string, data: any) {
        const billingId = data.id;
        const subscription = await this.subscriptionRepository.findByBillingId(billingId);

        if (!subscription) return;

        const payment = await this.paymentRepository.findByBillingId(billingId);
        if (payment) {
            // Disputed/lost payments are effectively refunded
            await this.paymentRepository.update(payment.id, {
                status: SubscriptionPaymentStatus.REFUNDED,
            });
        }

        await this.subscriptionRepository.updateStatus(
            subscription.id,
            subscription.userId,
            SubscriptionStatus.CANCELLED
        );

        const user = await this.userRepository.findById(subscription.userId);
        if (user) {
            await this.notificationService.notifySubscriptionRefunded(user.email, user.name);
        }

        console.log(`[Subscription] ${event} for user ${subscription.userId}. Subscription cancelled.`);
    }

    private async handleBillingRefunded(data: any) {
        const billingId = data.id;
        const subscription = await this.subscriptionRepository.findByBillingId(billingId);

        if (!subscription) return;

        const payment = await this.paymentRepository.findByBillingId(billingId);
        if (payment) {
            await this.paymentRepository.update(payment.id, {
                status: SubscriptionPaymentStatus.REFUNDED,
            });
        }

        await this.subscriptionRepository.updateStatus(
            subscription.id,
            subscription.userId,
            SubscriptionStatus.CANCELLED
        );

        const user = await this.userRepository.findById(subscription.userId);
        if (user) {
            await this.notificationService.notifySubscriptionRefunded(user.email, user.name);
        }
    }
}
