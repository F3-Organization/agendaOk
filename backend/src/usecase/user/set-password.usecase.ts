import { IUserRepository } from "../repositories/iuser-repository";
import * as bcrypt from "bcrypt";
import { SetPasswordDTO } from "../../../../shared/schemas/user.schema";
import { AppError } from "../../shared/errors/app-error";
import { t, type Locale } from "../../shared/i18n";

export class SetPasswordUseCase {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(userId: string, data: SetPasswordDTO, locale: Locale = "pt"): Promise<void> {
        const user = await this.userRepo.findById(userId);
        
        if (!user) {
            throw new AppError(t(locale, "user.notFound"), 404);
        }

        if (user.password) {
            throw new AppError(t(locale, "user.passwordAlreadySet"), 400);
        }

        const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);
        user.password = hashedNewPassword;

        await this.userRepo.save(user);
    }
}
