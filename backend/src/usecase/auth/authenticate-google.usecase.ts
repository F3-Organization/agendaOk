import { IGoogleCalendarService } from "../ports/igoogle-calendar-service";
import { IUserRepository } from "../repositories/iuser-repository";
import { ICompanyRepository } from "../repositories/icompany-repository";
import { User } from "../../infra/database/entities/user.entity";
import { ExchangeGoogleCodeUseCase } from "./exchange-google-code.usecase";

export class AuthenticateGoogleUseCase {
    constructor(
        private readonly googleService: IGoogleCalendarService,
        private readonly userRepo: IUserRepository,
        private readonly companyRepo: ICompanyRepository,
        private readonly exchangeCode: ExchangeGoogleCodeUseCase
    ) {}

    async execute(code: string): Promise<{ user: User, tokens: any, companyId: string | null }> {
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

        // Link Google tokens to user's first company if available
        const companies = await this.companyRepo.findByOwnerId(user.id);
        const defaultCompanyId = companies[0]?.id ?? null;

        if (defaultCompanyId) {
            // Save/Update Google tokens linked to the primary company
            await this.exchangeCode.execute(defaultCompanyId, tokens);
        }

        return { user, tokens, companyId: defaultCompanyId };
    }
}
