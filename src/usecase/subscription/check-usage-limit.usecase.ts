import { ISubscriptionRepository } from "../repositories/isubscription-repository";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { ICompanyRepository } from "../repositories/icompany-repository";
import { IPlanRepository } from "../repositories/iplan-repository";
import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";

const FREE_FALLBACK_LIMIT = 50;

export class CheckUsageLimitUseCase {
    constructor(
        private readonly subscriptionRepository: ISubscriptionRepository,
        private readonly scheduleRepository: IScheduleRepository,
        private readonly companyRepository: ICompanyRepository,
        private readonly planRepository: IPlanRepository
    ) {}

    async execute(companyId: string): Promise<{ canSend: boolean; plan: string; count: number; limit: number }> {
        const company = await this.companyRepository.findById(companyId);
        if (!company) {
            return { canSend: true, plan: "FREE", count: 0, limit: FREE_FALLBACK_LIMIT };
        }

        const subscription = await this.subscriptionRepository.findByUserId(company.ownerId);
        const planSlug = subscription?.plan || "FREE";
        const status = subscription?.status || SubscriptionStatus.INACTIVE;

        const planDef = await this.planRepository.findBySlug(planSlug);
        const messageLimit = planDef?.messageLimit ?? FREE_FALLBACK_LIMIT;

        // null messageLimit means unlimited
        if (status === SubscriptionStatus.ACTIVE && planDef?.messageLimit === null) {
            return { canSend: true, plan: planSlug, count: 0, limit: -1 };
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const count = await this.scheduleRepository.countMonthlyNotifications(companyId, startOfMonth, endOfMonth);

        return {
            canSend: count < messageLimit,
            plan: planSlug,
            count,
            limit: messageLimit
        };
    }
}
