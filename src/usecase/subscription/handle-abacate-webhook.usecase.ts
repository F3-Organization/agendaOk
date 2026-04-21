import { SubscriptionRepository } from "../../infra/database/repositories/subscription.repository";
import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";
import { ISubscriptionPaymentRepository } from "../repositories/isubscription-payment-repository";
import { SubscriptionPaymentStatus } from "../../infra/database/entities/subscription-payment.entity";
import { UserRepository } from "../../infra/database/repositories/user.repository";
import { CompanyConfigRepository } from "../../infra/database/repositories/company-config.repository";
import { SubscriptionNotificationService } from "./subscription-notification.service";
import { BrasilNFeAdapter } from "../../infra/adapters/brasil-nfe.adapter";
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
        private readonly fiscalAdapter: BrasilNFeAdapter,
        private readonly auditLogRepository: WebhookAuditLogRepository,
        private readonly paymentMethodRepository: PaymentMethodRepository,
        private readonly planRepository: PlanRepository
    ) {}

    private extractPaymentMethodCode(data: any): string | undefined {
        // AbacatePay v2 webhook: data.payment.method or data.method
        const raw: string | undefined =
            data?.payment?.method ??
            data?.method ??
            data?.paymentMethod ??
            undefined;

        if (!raw) return undefined;

        // Normalize to our known codes
        const upper = raw.toUpperCase();
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
        return MAP[upper] ?? upper;
    }

    async execute(payload: any) {
        const { event, data } = payload;

        // ── Always persist raw event for auditing ────────────────────────
        const methodCode = this.extractPaymentMethodCode(data);
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
            // v2 subscription events
            case "subscription.completed":  // first payment confirmed
            case "subscription.renewed":    // recurring payment confirmed
            case "checkout.completed":      // one-time checkout paid
                await this.handleBillingPaid(data, methodCode);
                break;

            case "subscription.cancelled":
                await this.handleBillingExpiredOrAbandoned("subscription.cancelled", data);
                break;

            case "checkout.refunded":
            case "subscription.refunded":
                await this.handleBillingRefunded(data);
                break;

            // v1 event names kept for backward compatibility
            case "billing.paid":
                await this.handleBillingPaid(data, methodCode);
                break;
            case "billing.expired":
            case "billing.abandoned":
                await this.handleBillingExpiredOrAbandoned(event, data);
                break;
            case "billing.refunded":
                await this.handleBillingRefunded(data);
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

        // Validate payment method against our reference table
        if (methodCode) {
            const knownMethod = await this.paymentMethodRepository.findByCode(methodCode);
            if (!knownMethod) {
                console.warn(`[Webhook] Unknown payment method code received: ${methodCode}. Storing as-is.`);
            }
        }

        const methodPatch = methodCode ? { paymentMethod: methodCode } : {};

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

        if (user) {
            await this.notificationService.notifyPaymentSuccess(user.email, user.name, subscription.plan);

            if (userConfig?.taxId) {
                try {
                    const isCpf = userConfig.taxId.length <= 11;

                    // Build address from company config or use fallback
                    const addressText = userConfig.address || "Não informado";
                    const tomador: any = {
                        nome_completo: user.name,
                        email: user.email,
                        endereco: {
                            logradouro: addressText,
                            numero: "S/N",
                            bairro: "Não informado",
                            cep: "00000-000",
                            codigo_municipio: "3550308",
                            uf: "SP",
                        },
                    };
                    if (isCpf) tomador.cpf = userConfig.taxId;
                    else tomador.cnpj = userConfig.taxId;

                    // Use actual payment amount; fallback to plan price from DB
                    const paidAmountCents = data.paidAmount ?? data.amount ?? data.payment?.amount;
                    let valorServicos: number;
                    if (paidAmountCents != null) {
                        valorServicos = paidAmountCents / 100;
                    } else {
                        const plan = await this.planRepository.findBySlug(subscription.plan);
                        valorServicos = plan ? plan.priceInCents / 100 : 0;
                    }

                    await this.fiscalAdapter.emitirNfse(billingId, {
                        tomador,
                        servico: {
                            aliquota: 2,
                            discriminacao: `Assinatura Mensal ConfirmaZap - Plano ${subscription.plan}`,
                            iss_retido: false,
                            item_lista_servico: "01.07",
                            valor_servicos: valorServicos,
                        },
                    });
                    console.log(`[Fiscal] Invoice issued for billing ${billingId}`);
                } catch (error) {
                    console.error(`[Fiscal] Failed to issue invoice for billing ${billingId}:`, error);
                }
            }
        }

        console.log(`[Subscription] User ${subscription.userId} activated via Abacate Pay.`);
    }

    private async handleBillingExpiredOrAbandoned(event: string, data: any) {
        const billingId = data.id;
        const subscription = await this.subscriptionRepository.findByBillingId(billingId);

        if (!subscription) return;

        const payment = await this.paymentRepository.findByBillingId(billingId);
        if (payment) {
            const isExpired = event === "billing.expired";
            await this.paymentRepository.update(payment.id, {
                status: isExpired
                    ? SubscriptionPaymentStatus.EXPIRED
                    : SubscriptionPaymentStatus.CANCELLED,
            });
        }

        if (subscription.status === SubscriptionStatus.PENDING) {
            await this.subscriptionRepository.updateStatus(
                subscription.id,
                subscription.userId,
                SubscriptionStatus.INACTIVE
            );

            const user = await this.userRepository.findById(subscription.userId);
            if (user) {
                await this.notificationService.notifySubscriptionExpired(user.email, user.name);
            }
        }
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
