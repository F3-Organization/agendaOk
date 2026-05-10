import { IGoogleAuthService } from "../ports/igoogle-auth-service";
import { IUserRepository } from "../repositories/iuser-repository";
import { ICompanyRepository } from "../repositories/icompany-repository";
import { User } from "../../infra/database/entities/user.entity";

export class AuthenticateGoogleUseCase {
    constructor(
        private readonly googleService: IGoogleAuthService,
        private readonly userRepo: IUserRepository,
        private readonly companyRepo: ICompanyRepository
    ) {}

    async execute(code: string): Promise<{ user: User, companyId: string | null }> {
        const tokens = await this.googleService.getTokens(code);
        const profile = await this.googleService.getUserProfile(tokens.access_token);

        let user = await this.userRepo.findByGoogleId(profile.id);

        if (!user) {
            user = await this.userRepo.findByEmail(profile.email);

            if (!user) {
                user = new User();
                user.email = profile.email;
                user.name = profile.name;
            }

            user.googleId = profile.id;
            user = await this.userRepo.save(user);
        }

        const companies = await this.companyRepo.findByOwnerId(user.id);
        const defaultCompanyId = companies[0]?.id ?? null;

        return { user, companyId: defaultCompanyId };
    }
}
