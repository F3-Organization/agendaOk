import { ISubscriptionRepository } from "../repositories/isubscription-repository";
import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";
import { UserRepository } from "../../infra/database/repositories/user.repository";
import { SubscriptionNotificationService } from "./subscription-notification.service";

export class CheckExpiredSubscriptionsUseCase {
    constructor(
        private readonly subscriptionRepository: ISubscriptionRepository,
        private readonly userRepository: UserRepository,
        private readonly notificationService: SubscriptionNotificationService
    ) {}

    async execute(): Promise<{ processed: number }> {
        const expired = await this.subscriptionRepository.findExpired();

        for (const subscription of expired) {
            const newStatus = subscription.status === SubscriptionStatus.TRIAL
                ? SubscriptionStatus.CANCELLED
                : SubscriptionStatus.PAST_DUE;

            await this.subscriptionRepository.updateStatus(
                subscription.id,
                subscription.userId,
                newStatus
            );

            const user = await this.userRepository.findById(subscription.userId);
            if (user) {
                await this.notificationService.notifySubscriptionExpired(user.email, user.name);
            }

            console.log(
                `[SubscriptionChecker] ${subscription.id} (${subscription.status}) → ${newStatus} for user ${subscription.userId}`
            );
        }

        return { processed: expired.length };
    }
}
