import { ICompanyRepository } from "../repositories/icompany-repository";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { ISubscriptionRepository } from "../repositories/isubscription-repository";
import { Company } from "../../infra/database/entities/company.entity";
import { CompanyConfig } from "../../infra/database/entities/company-config.entity";
import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";

const PLAN_LIMITS = {
    FREE: 1,
    PRO: 3,
} as const;

interface CreateCompanyInput {
    ownerId: string;
    name: string;
}

export class CreateCompanyUseCase {
    constructor(
        private readonly companyRepository: ICompanyRepository,
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly subscriptionRepository: ISubscriptionRepository
    ) {}

    async execute(input: CreateCompanyInput): Promise<Company> {
        // Check company limit based on user's plan
        const existingCompanies = await this.companyRepository.findByOwnerId(input.ownerId);
        const subscription = await this.subscriptionRepository.findByUserId(input.ownerId);

        const isProActive = subscription?.status === SubscriptionStatus.ACTIVE && subscription?.plan === "PRO";
        const maxCompanies = isProActive ? PLAN_LIMITS.PRO : PLAN_LIMITS.FREE;

        if (existingCompanies.length >= maxCompanies) {
            const planName = isProActive ? "PRO" : "FREE";
            throw new Error(`Company limit reached. ${planName} plan allows up to ${maxCompanies} company(ies). Please upgrade your plan.`);
        }

        const slug = this.generateSlug(input.name);

        // Check slug uniqueness
        const existingSlug = await this.companyRepository.findBySlug(slug);
        if (existingSlug) {
            throw new Error("A company with a similar name already exists");
        }

        // Create company
        const company = new Company();
        company.ownerId = input.ownerId;
        company.name = input.name;
        company.slug = slug;
        const savedCompany = await this.companyRepository.save(company);

        // Create default company config
        const config = new CompanyConfig();
        config.companyId = savedCompany.id;
        await this.companyConfigRepository.save(config);

        return savedCompany;
    }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            + "-" + Date.now().toString(36);
    }
}
