import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";
import { ISubscriptionRepository } from "../repositories/isubscription-repository";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { ICompanyRepository } from "../repositories/icompany-repository";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
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
        private readonly companyRepo: ICompanyRepository,
        private readonly companyConfigRepo: ICompanyConfigRepository
    ) {}

    async execute(userId: string): Promise<SubscriptionStatusResponse> {
        const subscription = await this.subscriptionRepo.findByUserId(userId);

        // Resolve user's primary company for config and message count
        const companies = await this.companyRepo.findByOwnerId(userId);
        const primaryCompany = companies[0];
        const companyConfig = primaryCompany
            ? await this.companyConfigRepo.findByCompanyId(primaryCompany.id)
            : null;
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Count messages across all user's companies
        let messageCount = 0;
        for (const company of companies) {
            messageCount += await this.scheduleRepo.countMonthlyNotifications(company.id, startOfMonth, endOfMonth);
        }

        const baseResponse = {
            messageCount,
            taxId: companyConfig?.taxId,
            whatsappNumber: companyConfig?.whatsappNumber
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
