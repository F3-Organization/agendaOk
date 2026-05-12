import { authenticator } from "otplib";
import { IUserRepository } from "../repositories/iuser-repository";
import { AppError } from "../../shared/errors/app-error";
import { t, type Locale } from "../../shared/i18n";

export class Verify2FAUseCase {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(userId: string, token: string, locale: Locale = "pt"): Promise<void> {
        const user = await this.userRepo.findById(userId);
        
        if (!user) {
            throw new AppError(t(locale, "user.notFound"), 404);
        }

        if (!user.twoFactorSecret) {
            throw new AppError(t(locale, "user.twoFactorNotConfigured"), 400);
        }

        const isValid = authenticator.verify({
            token,
            secret: user.twoFactorSecret
        });

        if (!isValid) {
            throw new AppError(t(locale, "user.invalidToken"), 400);
        }

        user.twoFactorEnabled = true;
        await this.userRepo.save(user);
    }
}
