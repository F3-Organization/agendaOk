import { ISubscriptionRepository } from "../repositories/isubscription-repository";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";

export class CheckUsageLimitUseCase {
    constructor(
        private readonly subscriptionRepository: ISubscriptionRepository,
        private readonly scheduleRepository: IScheduleRepository
    ) {}

    /**
     * Verifies if the user can still send messages based on their plan's monthly limit.
     * FREE users are capped at 50 messages/month.
     * PRO users have no limit.
     */
    async execute(companyId: string): Promise<{ canSend: boolean; plan: string; count: number; limit: number }> {
        const subscription = await this.subscriptionRepository.findByCompanyId(companyId);
        const plan = subscription?.plan || "FREE";
        const status = subscription?.status || SubscriptionStatus.INACTIVE;

        // PRO plans have unlimited messages if active
        if (status === SubscriptionStatus.ACTIVE && plan === "PRO") {
            return { 
                canSend: true, 
                plan: "PRO", 
                count: 0, 
                limit: -1 
            };
        }

        // Calculate usage for the current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        
        const count = await this.scheduleRepository.countMonthlyNotifications(companyId, startOfMonth, endOfMonth);
        const limit = 50;

        return {
            canSend: count < limit,
            plan,
            count,
            limit
        };
    }
}
