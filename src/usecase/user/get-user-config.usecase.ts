import { IUserRepository } from "../repositories/iuser-repository";
import { ICompanyRepository } from "../repositories/icompany-repository";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { AppError } from "../../shared/errors/app-error";
import { UserConfigDTO } from "../../../shared/schemas/user.schema";

export class GetUserConfigUseCase {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly companyRepo: ICompanyRepository,
        private readonly companyConfigRepo: ICompanyConfigRepository
    ) {}

    async execute(userId: string, companyId?: string): Promise<UserConfigDTO> {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new AppError("Usuário não encontrado", 404);
        }

        // If no companyId given, resolve from user's companies
        let resolvedCompanyId = companyId;
        if (!resolvedCompanyId) {
            const companies = await this.companyRepo.findByOwnerId(userId);
            resolvedCompanyId = companies[0]?.id;
        }

        const config = resolvedCompanyId
            ? await this.companyConfigRepo.findByCompanyId(resolvedCompanyId)
            : null;

        return {
            name: user.name,
            email: user.email,
            whatsappNumber: config?.whatsappNumber,
            taxId: config?.taxId,
            silentWindowStart: config?.silentWindowStart ?? "22:00",
            silentWindowEnd: config?.silentWindowEnd ?? "08:00",
            syncEnabled: config?.syncEnabled ?? true,
            twoFactorEnabled: user.twoFactorEnabled ?? false,
            hasPassword: !!user.password,
        };
    }
}
