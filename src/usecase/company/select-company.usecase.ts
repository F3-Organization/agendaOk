import { ICompanyRepository } from "../repositories/icompany-repository";
import { ITokenService } from "../ports/itoken-service";

interface SelectCompanyInput {
    userId: string;
    companyId: string;
}

interface SelectCompanyOutput {
    token: string;
    company: { id: string; name: string; slug: string };
}

export class SelectCompanyUseCase {
    constructor(
        private readonly companyRepository: ICompanyRepository,
        private readonly tokenService: ITokenService
    ) {}

    async execute(input: SelectCompanyInput): Promise<SelectCompanyOutput> {
        const company = await this.companyRepository.findById(input.companyId);

        if (!company) {
            throw new Error("Company not found");
        }

        if (company.ownerId !== input.userId) {
            throw new Error("Forbidden");
        }

        // Generate a new JWT that includes companyId
        const token = await this.tokenService.signWithCompany({
            id: input.userId,
            companyId: company.id
        });

        return {
            token,
            company: {
                id: company.id,
                name: company.name,
                slug: company.slug
            }
        };
    }
}
