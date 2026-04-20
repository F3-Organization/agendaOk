import { ICompanyRepository } from "../repositories/icompany-repository";
import { IUserRepository } from "../repositories/iuser-repository";
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
        private readonly tokenService: ITokenService,
        private readonly userRepository?: IUserRepository
    ) {}

    async execute(input: SelectCompanyInput): Promise<SelectCompanyOutput> {
        const company = await this.companyRepository.findById(input.companyId);

        if (!company) {
            throw new Error("Company not found");
        }

        if (company.ownerId !== input.userId) {
            throw new Error("Forbidden");
        }

        // Fetch user to include full info in the JWT
        const user = this.userRepository ? await this.userRepository.findById(input.userId) : null;

        // Generate a new JWT that includes companyId and user info
        const token = this.tokenService.sign({
            id: input.userId,
            email: user?.email,
            name: user?.name,
            role: user?.role || "USER",
            companyId: company.id
        }, { expiresIn: "7d" });

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
