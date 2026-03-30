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
                    periodEnd
                );

                console.log(`[Subscription] User ${subscription.userId} activated via Abacate Pay.`);
            }
        }
        
        // Outros eventos (expiration, refund) podem ser adicionados aqui
        return { status: "processed" };
    }
}
