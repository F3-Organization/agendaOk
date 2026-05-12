import { IUserRepository } from "../repositories/iuser-repository";
import * as bcrypt from "bcrypt";
import { ChangePasswordDTO } from "../../../../shared/schemas/user.schema";
import { t, type Locale } from "../../shared/i18n";

export class ChangePasswordUseCase {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(userId: string, data: ChangePasswordDTO, locale: Locale = "pt"): Promise<void> {
        const user = await this.userRepo.findById(userId);
        
        if (!user) {
            throw new Error(t(locale, "user.notFound"));
        }

        if (user.password) {
            if (!data.currentPassword) {
                throw new Error(t(locale, "user.currentPasswordRequired"));
            }
            const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
            if (!isPasswordValid) {
                throw new Error(t(locale, "user.currentPasswordIncorrect"));
            }
        }

        const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);
        user.password = hashedNewPassword;

        await this.userRepo.save(user);
    }
}
