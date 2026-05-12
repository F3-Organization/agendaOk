import { authenticator } from "otplib";
import { IUserRepository } from "../repositories/iuser-repository";
import { AppError } from "../../shared/errors/app-error";
import { t, type Locale } from "../../shared/i18n";

export class Validate2FAUseCase {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(userId: string, token: string, locale: Locale = "pt"): Promise<boolean> {
        const user = await this.userRepo.findById(userId);
        
        if (!user) {
            throw new AppError(t(locale, "user.notFound"), 404);
        }

        if (!user.twoFactorSecret) {
            throw new AppError(t(locale, "user.twoFactorNotConfigured"), 400);
        }

        return authenticator.verify({
            token,
            secret: user.twoFactorSecret
        });
    }
}
