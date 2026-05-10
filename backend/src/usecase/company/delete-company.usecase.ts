import { ICompanyRepository } from "../repositories/icompany-repository";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";

interface DeleteCompanyInput {
    userId: string;
    companyId: string;
}

export class DeleteCompanyUseCase {
    constructor(
        private readonly companyRepository: ICompanyRepository,
        private readonly companyConfigRepository: ICompanyConfigRepository
    ) {}

    async execute(input: DeleteCompanyInput): Promise<void> {
        const company = await this.companyRepository.findById(input.companyId);
        if (!company) {
            throw new Error("Company not found");
        }

        if (company.ownerId !== input.userId) {
            throw new Error("Forbidden");
        }

        // Delete company config first (FK constraint)
        await this.companyConfigRepository.deleteByCompanyId(input.companyId);

        // Delete company
        await this.companyRepository.delete(input.companyId);
    }
}
