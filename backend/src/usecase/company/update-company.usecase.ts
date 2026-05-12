import { ICompanyRepository } from "../repositories/icompany-repository";
import { t, type Locale } from "../../shared/i18n";

interface UpdateCompanyInput {
    userId: string;
    companyId: string;
    name: string;
    locale?: Locale;
}

export class UpdateCompanyUseCase {
    constructor(
        private readonly companyRepository: ICompanyRepository
    ) {}

    async execute(input: UpdateCompanyInput): Promise<void> {
        const locale = input.locale ?? "pt";
        const company = await this.companyRepository.findById(input.companyId);

        if (!company) {
            throw new Error(t(locale, "company.notFound"));
        }

        if (company.ownerId !== input.userId) {
            throw new Error(t(locale, "company.forbidden"));
        }

        await this.companyRepository.update(input.companyId, { name: input.name });
    }
}
