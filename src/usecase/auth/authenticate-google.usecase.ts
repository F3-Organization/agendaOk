import { IGoogleCalendarService } from "../ports/igoogle-calendar-service";
import { IUserRepository } from "../repositories/iuser-repository";
import { ICompanyRepository } from "../repositories/icompany-repository";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { User } from "../../infra/database/entities/user.entity";
import { Company } from "../../infra/database/entities/company.entity";
import { CompanyConfig } from "../../infra/database/entities/company-config.entity";
import { ExchangeGoogleCodeUseCase } from "./exchange-google-code.usecase";

export class AuthenticateGoogleUseCase {
    constructor(
        private readonly googleService: IGoogleCalendarService,
        private readonly userRepo: IUserRepository,
        private readonly companyRepo: ICompanyRepository,
        private readonly companyConfigRepo: ICompanyConfigRepository,
        private readonly exchangeCode: ExchangeGoogleCodeUseCase
    ) {}

    async execute(code: string): Promise<{ user: User, tokens: any, companyId: string }> {
        const tokens = await this.googleService.getTokens(code);
        const profile = await this.googleService.getUserProfile(tokens.access_token);

        let user = await this.userRepo.findByGoogleId(profile.id);
        
        if (!user) {
            // Check if user exists with same email (maybe they registered normally before)
            user = await this.userRepo.findByEmail(profile.email);
            
            if (!user) {
                user = new User();
                user.email = profile.email;
                user.name = profile.name;
            }
            
            user.googleId = profile.id;
            user = await this.userRepo.save(user);
        }

        // Ensure user has at least one company (create default if needed)
        let companies = await this.companyRepo.findByOwnerId(user.id);
        if (companies.length === 0) {
            const company = new Company();
            company.ownerId = user.id;
            company.name = user.name;
            company.slug = this.generateSlug(user.name);
            const savedCompany = await this.companyRepo.save(company);

            // Create default config for the company
            const config = new CompanyConfig();
            config.companyId = savedCompany.id;
            await this.companyConfigRepo.save(config);

            companies = [savedCompany];
        }

        const defaultCompanyId = companies[0]!.id;

        // Save/Update Google tokens linked to the default company 
        await this.exchangeCode.execute(defaultCompanyId, tokens);

        return { user, tokens, companyId: defaultCompanyId };
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
