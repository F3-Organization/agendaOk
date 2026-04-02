import { SubscriptionRepository } from "../../infra/database/repositories/subscription.repository";
import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";
import { ISubscriptionPaymentRepository } from "../repositories/isubscription-payment-repository";
import { SubscriptionPaymentStatus } from "../../infra/database/entities/subscription-payment.entity";

export class HandleAbacatePayWebhookUseCase {
    constructor(
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly paymentRepository: ISubscriptionPaymentRepository
    ) {}

    async execute(payload: any) {
        const { event, data } = payload;

        if (event === "billing.paid") {
            const billingId = data.id;
            const subscription = await this.subscriptionRepository.findByBillingId(billingId);

            if (subscription) {
                // 1. Atualizar histórico de pagamento
                const payment = await this.paymentRepository.findByBillingId(billingId);
                if (payment) {
                    await this.paymentRepository.update(payment.id, {
                        status: SubscriptionPaymentStatus.PAID,
                        paidAt: new Date()
                    });
                }

                // 2. Ativar assinatura por 30 dias a partir de agora
                const periodEnd = new Date();
                periodEnd.setDate(periodEnd.getDate() + 30);

                await this.subscriptionRepository.updateStatus(
                    subscription.id, 
                    subscription.userId,
                    SubscriptionStatus.ACTIVE,
                    periodEnd,
                    "PRO"
                );

                // Desativar outras assinaturas ativas do usuário
                await this.subscriptionRepository.deactivateOthers(subscription.userId, subscription.id);

                console.log(`[Subscription] User ${subscription.userId} activated via Abacate Pay.`);
            }
        } else if (event === "billing.expired" || event === "billing.abandoned") {
            const billingId = data.id;
            const subscription = await this.subscriptionRepository.findByBillingId(billingId);

            if (subscription) {
                const payment = await this.paymentRepository.findByBillingId(billingId);
                if (payment) {
                    await this.paymentRepository.update(payment.id, {
                        status: event === "billing.expired" ? SubscriptionPaymentStatus.EXPIRED : SubscriptionPaymentStatus.CANCELLED
                    });
                }

                // Se a assinatura ainda estiver PENDING, marcamos como INACTIVE
                if (subscription.status === SubscriptionStatus.PENDING) {
                    await this.subscriptionRepository.updateStatus(
                        subscription.id,
                        subscription.userId,
                        SubscriptionStatus.INACTIVE
                    );
                }
            }
        } else if (event === "billing.refunded") {
            const billingId = data.id;
            const subscription = await this.subscriptionRepository.findByBillingId(billingId);

            if (subscription) {
                const payment = await this.paymentRepository.findByBillingId(billingId);
                if (payment) {
                    await this.paymentRepository.update(payment.id, {
                        status: SubscriptionPaymentStatus.REFUNDED
                    });
                }

                // Plano reembolsado perde o acesso PRO
                await this.subscriptionRepository.updateStatus(
                    subscription.id,
                    subscription.userId,
                    SubscriptionStatus.CANCELLED
                );
            }
        }
        
        // Outros eventos (expiration, refund) podem ser adicionados aqui
        return { status: "processed" };
    }
}
