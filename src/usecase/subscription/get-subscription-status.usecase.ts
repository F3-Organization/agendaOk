import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";
import { ISubscriptionRepository } from "../repositories/isubscription-repository";
import { IScheduleRepository } from "../repositories/ischedule-repository";

export interface SubscriptionStatusResponse {
    status: SubscriptionStatus;
    plan: string;
    messageCount: number;
    currentPeriodEnd?: Date | undefined;
    checkoutUrl?: string | undefined;
}


export class GetSubscriptionStatusUseCase {
    constructor(
        private readonly subscriptionRepo: ISubscriptionRepository,
        private readonly scheduleRepo: IScheduleRepository
    ) {}

    async execute(userId: string): Promise<SubscriptionStatusResponse> {
        const subscription = await this.subscriptionRepo.findByUserId(userId);
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const messageCount = await this.scheduleRepo.countMonthlyNotifications(userId, startOfMonth, endOfMonth);

        if (!subscription) {
            return {
                status: SubscriptionStatus.ACTIVE,
                plan: "FREE",
                messageCount
            };
        }

        return {
            status: subscription.status,
            plan: subscription.plan,
            messageCount,
            currentPeriodEnd: subscription.currentPeriodEnd,
            checkoutUrl: subscription.checkoutUrl
        };
    }
}
