import { ICompanyRepository } from "../repositories/icompany-repository";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { t, type Locale } from "../../shared/i18n";

interface DeleteCompanyInput {
    userId: string;
    companyId: string;
    locale?: Locale;
}

export class DeleteCompanyUseCase {
    constructor(
        private readonly companyRepository: ICompanyRepository,
        private readonly companyConfigRepository: ICompanyConfigRepository
    ) {}

    async execute(input: DeleteCompanyInput): Promise<void> {
        const locale = input.locale ?? "pt";
        const company = await this.companyRepository.findById(input.companyId);
        if (!company) {
            throw new Error(t(locale, "company.notFound"));
        }

        if (company.ownerId !== input.userId) {
            throw new Error(t(locale, "company.forbidden"));
        }

        // Delete company config first (FK constraint)
        await this.companyConfigRepository.deleteByCompanyId(input.companyId);

        // Delete company
        await this.companyRepository.delete(input.companyId);
    }
}
