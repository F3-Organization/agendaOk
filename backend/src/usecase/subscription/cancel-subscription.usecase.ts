import { SubscriptionRepository } from "../../infra/database/repositories/subscription.repository";
import { UserRepository } from "../../infra/database/repositories/user.repository";
import { IPaymentGateway } from "../ports/ipayment-gateway";
import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";
import { ISubscriptionPaymentRepository } from "../repositories/isubscription-payment-repository";
import { SubscriptionPaymentStatus } from "../../infra/database/entities/subscription-payment.entity";
import { SubscriptionNotificationService } from "./subscription-notification.service";

export class CancelSubscriptionUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly paymentRepository: ISubscriptionPaymentRepository,
        private readonly paymentGateway: IPaymentGateway,
        private readonly notificationService: SubscriptionNotificationService
    ) { }

    async execute(userId: string): Promise<void> {
        const subscription = await this.subscriptionRepository.findByUserId(userId);

        if (!subscription) throw new Error("No subscription found.");

        const cancellable: SubscriptionStatus[] = [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL, SubscriptionStatus.PENDING];
        if (!cancellable.includes(subscription.status as SubscriptionStatus)) {
            throw new Error("Subscription is not in a cancellable state.");
        }

        // Cancel on Abacate Pay only for card-based subscriptions (they have a billingId)
        if (subscription.abacateBillingId) {
            try {
                await this.paymentGateway.cancelSubscription(subscription.abacateBillingId);
            } catch (error: any) {
                // Log but don't block — we still cancel locally
                console.warn(`[CancelSubscription] Gateway cancel failed for ${subscription.abacateBillingId}:`, error.message);
            }
        }

        await this.subscriptionRepository.updateStatus(
            subscription.id,
            userId,
            SubscriptionStatus.CANCELLED
        );

        // Cancel any pending payments
        const pendingPayment = await this.paymentRepository.findPendingByUser(subscription.id);
        if (pendingPayment) {
            await this.paymentRepository.update(pendingPayment.id, {
                status: SubscriptionPaymentStatus.CANCELLED,
            });
        }

        const user = await this.userRepository.findById(userId);
        if (user) {
            await this.notificationService.notifySubscriptionExpired(user.email, user.name);
        }

        console.log(`[CancelSubscription] Subscription cancelled for user ${userId}.`);
    }
}
