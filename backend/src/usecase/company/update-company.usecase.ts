import { ICompanyRepository } from "../repositories/icompany-repository";

interface UpdateCompanyInput {
    userId: string;
    companyId: string;
    name: string;
}

export class UpdateCompanyUseCase {
    constructor(
        private readonly companyRepository: ICompanyRepository
    ) {}

    async execute(input: UpdateCompanyInput): Promise<void> {
        const company = await this.companyRepository.findById(input.companyId);

        if (!company) {
            throw new Error("Company not found");
        }

        if (company.ownerId !== input.userId) {
            throw new Error("Forbidden");
        }

        await this.companyRepository.update(input.companyId, { name: input.name });
    }
}
