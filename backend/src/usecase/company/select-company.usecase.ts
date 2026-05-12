import { ICompanyRepository } from "../repositories/icompany-repository";
import { IUserRepository } from "../repositories/iuser-repository";
import { IProfessionalRepository } from "../repositories/iprofessional-repository";
import { ITokenService } from "../ports/itoken-service";
import { t, type Locale } from "../../shared/i18n";

interface SelectCompanyInput {
    userId: string;
    userRole: string;
    companyId: string;
    locale?: Locale;
}

interface SelectCompanyOutput {
    token: string;
    company: { id: string; name: string; slug: string };
}

export class SelectCompanyUseCase {
    constructor(
        private readonly companyRepository: ICompanyRepository,
        private readonly tokenService: ITokenService,
        private readonly userRepository?: IUserRepository,
        private readonly professionalRepository?: IProfessionalRepository
    ) {}

    async execute(input: SelectCompanyInput): Promise<SelectCompanyOutput> {
        const locale = input.locale ?? "pt";
        const company = await this.companyRepository.findById(input.companyId);
        if (!company) throw new Error(t(locale, "company.notFound"));

        const user = this.userRepository ? await this.userRepository.findById(input.userId) : null;

        if (input.userRole === "PROFESSIONAL") {
            if (!this.professionalRepository) throw new Error(t(locale, "error.internal"));
            const professional = await this.professionalRepository.findByUserIdAndCompanyId(input.userId, input.companyId);
            if (!professional) throw new Error(t(locale, "company.forbidden"));

            const token = this.tokenService.sign({
                id: input.userId,
                email: user?.email,
                name: user?.name,
                role: "PROFESSIONAL",
                companyId: company.id,
                professionalId: professional.id,
            }, { expiresIn: "7d" });

            return { token, company: { id: company.id, name: company.name, slug: company.slug } };
        }

        if (company.ownerId !== input.userId) throw new Error(t(locale, "company.forbidden"));

        const token = this.tokenService.sign({
            id: input.userId,
            email: user?.email,
            name: user?.name,
            role: user?.role || "USER",
            companyId: company.id
        }, { expiresIn: "7d" });

        return { token, company: { id: company.id, name: company.name, slug: company.slug } };
    }
}
