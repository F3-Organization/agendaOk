import { IUserRepository } from "../repositories/iuser-repository";
import { ITokenService } from "../ports/itoken-service";
import { Validate2FAUseCase } from "../user/validate-2fa.usecase";
import { User } from "../../infra/database/entities/user.entity";
import { t, type Locale } from "../../shared/i18n";

export class LoginVerify2FAUseCase {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly tokenService: ITokenService,
        private readonly validate2FA: Validate2FAUseCase
    ) {}

    async execute(tempToken: string, code: string, locale: Locale = "pt"): Promise<User> {
        let decoded: any;
        try {
            decoded = this.tokenService.verify(tempToken);
        } catch (error) {
            throw new Error(t(locale, "auth.invalidOrExpiredToken"));
        }

        if (!decoded || !decoded.is2FAPending || !decoded.id) {
            throw new Error(t(locale, "auth.invalidTokenStructure"));
        }

        const isValid = await this.validate2FA.execute(decoded.id, code);
        if (!isValid) {
            throw new Error(t(locale, "auth.invalid2FACode"));
        }

        const user = await this.userRepo.findById(decoded.id);
        if (!user) {
            throw new Error(t(locale, "auth.userNotFound"));
        }

        return user;
    }
}
