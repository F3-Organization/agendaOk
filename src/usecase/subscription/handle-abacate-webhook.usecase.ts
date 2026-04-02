import { SubscriptionRepository } from "../../infra/database/repositories/subscription.repository";
import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";
import { ISubscriptionPaymentRepository } from "../repositories/isubscription-payment-repository";
import { SubscriptionPaymentStatus } from "../../infra/database/entities/subscription-payment.entity";
import { UserRepository } from "../../infra/database/repositories/user.repository";
import { SubscriptionNotificationService } from "./subscription-notification.service";

export class HandleAbacatePayWebhookUseCase {
    constructor(
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly paymentRepository: ISubscriptionPaymentRepository,
        private readonly userRepository: UserRepository,
        private readonly notificationService: SubscriptionNotificationService
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

                await this.subscriptionRepository.deactivateOthers(subscription.userId, subscription.id);

                // 4. Enviar notificação por e-mail
                const user = await this.userRepository.findById(subscription.userId);
                if (user) {
                    await this.notificationService.notifyPaymentSuccess(user.email, user.name, "PRO");
                }

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

                    // Notificar expiração/cancelamento
                    const user = await this.userRepository.findById(subscription.userId);
                    if (user) {
                        await this.notificationService.notifySubscriptionExpired(user.email, user.name);
                    }
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

                // Notificar reembolso
                const user = await this.userRepository.findById(subscription.userId);
                if (user) {
                    await this.notificationService.notifySubscriptionRefunded(user.email, user.name);
                }
            }
        }
        
        // Outros eventos (expiration, refund) podem ser adicionados aqui
        return { status: "processed" };
    }
}
