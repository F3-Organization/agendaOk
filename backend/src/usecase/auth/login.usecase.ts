import { IUserRepository } from "../repositories/iuser-repository";
import { User } from "../../infra/database/entities/user.entity";
import * as bcrypt from "bcrypt";
import { t, type Locale } from "../../shared/i18n";

export class LoginUseCase {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(email: string, password: string, locale: Locale = "pt"): Promise<User> {
        const user = await this.userRepo.findByEmail(email);
        
        if (!user || !user.password) {
            throw new Error(t(locale, "auth.invalidCredentials"));
        }

        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) {
            throw new Error(t(locale, "auth.invalidCredentials"));
        }

        return user;
    }
}
