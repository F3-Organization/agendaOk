import { ICompanyRepository } from "../repositories/icompany-repository";
import { ISubscriptionRepository } from "../repositories/isubscription-repository";

interface CompanyWithSubscription {
    id: string;
    name: string;
    slug: string;
    subscription?: { plan: string; status: string } | null;
}

export class ListCompaniesUseCase {
    constructor(
        private readonly companyRepository: ICompanyRepository,
        private readonly subscriptionRepository: ISubscriptionRepository
    ) {}

    async execute(userId: string): Promise<CompanyWithSubscription[]> {
        const companies = await this.companyRepository.findByOwnerId(userId);

        const result: CompanyWithSubscription[] = [];
        for (const company of companies) {
            const subscription = await this.subscriptionRepository.findByCompanyId(company.id);
            result.push({
                id: company.id,
                name: company.name,
                slug: company.slug,
                subscription: subscription
                    ? { plan: subscription.plan, status: subscription.status }
                    : null
            });
        }

        return result;
    }
}
