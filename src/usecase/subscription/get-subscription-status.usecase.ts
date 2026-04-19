import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";
import { ISubscriptionRepository } from "../repositories/isubscription-repository";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { CompanyConfigRepository } from "../../infra/database/repositories/company-config.repository";
import { env } from "../../infra/config/configs";

export interface SubscriptionStatusResponse {
    status: SubscriptionStatus;
    plan: string;
    messageCount: number;
    currentPeriodEnd?: Date | undefined;
    checkoutUrl?: string | undefined;
    amount?: number | undefined;
    planName?: string | undefined;
    taxId?: string | undefined;
    whatsappNumber?: string | undefined;
}


export class GetSubscriptionStatusUseCase {
    constructor(
        private readonly subscriptionRepo: ISubscriptionRepository,
        private readonly scheduleRepo: IScheduleRepository,
        private readonly userConfigRepo: CompanyConfigRepository
    ) {}

    async execute(companyId: string): Promise<SubscriptionStatusResponse> {
        const subscription = await this.subscriptionRepo.findByCompanyId(companyId);
        const userConfig = await this.userConfigRepo.findByCompanyId(companyId);
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const messageCount = await this.scheduleRepo.countMonthlyNotifications(companyId, startOfMonth, endOfMonth);

        const baseResponse = {
            messageCount,
            taxId: userConfig?.taxId,
            whatsappNumber: userConfig?.whatsappNumber
        };

        if (!subscription) {
            return {
                ...baseResponse,
                status: SubscriptionStatus.ACTIVE,
                plan: "FREE",
            };
        }

        return {
            ...baseResponse,
            status: subscription.status,
            plan: subscription.plan,
            currentPeriodEnd: subscription.currentPeriodEnd,
            checkoutUrl: subscription.checkoutUrl,
            amount: env.abacatePay.planPrice,
            planName: env.abacatePay.planName
        };
    }
}
