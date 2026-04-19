import { ICompanyRepository } from "../repositories/icompany-repository";
import { ISubscriptionRepository } from "../repositories/isubscription-repository";
import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";

const PLAN_LIMITS = {
    FREE: 1,
    PRO: 3,
} as const;

interface CompanyWithSubscription {
    id: string;
    name: string;
    slug: string;
    subscription?: { plan: string; status: string } | null;
}

interface ListCompaniesResult {
    companies: CompanyWithSubscription[];
    maxCompanies: number;
}

export class ListCompaniesUseCase {
    constructor(
        private readonly companyRepository: ICompanyRepository,
        private readonly subscriptionRepository: ISubscriptionRepository
    ) {}

    async execute(userId: string): Promise<ListCompaniesResult> {
        const companies = await this.companyRepository.findByOwnerId(userId);

        // Subscription belongs to the user, not the company — fetch once
        const subscription = await this.subscriptionRepository.findByUserId(userId);
        const subscriptionData = subscription
            ? { plan: subscription.plan, status: subscription.status }
            : null;

        const isProActive = subscription?.status === SubscriptionStatus.ACTIVE && subscription?.plan === "PRO";
        const maxCompanies = isProActive ? PLAN_LIMITS.PRO : PLAN_LIMITS.FREE;

        return {
            companies: companies.map(company => ({
                id: company.id,
                name: company.name,
                slug: company.slug,
                subscription: subscriptionData
            })),
            maxCompanies
        };
    }
}
