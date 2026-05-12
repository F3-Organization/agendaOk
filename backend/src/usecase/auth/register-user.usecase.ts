import { IUserRepository } from "../repositories/iuser-repository";
import { User } from "../../infra/database/entities/user.entity";
import * as bcrypt from "bcrypt";
import { t, type Locale } from "../../shared/i18n";

export interface RegisterUserDTO {
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    whatsappNumber: string;
    locale?: Locale;
}

export class RegisterUserUseCase {
    constructor(
        private readonly userRepo: IUserRepository
    ) {}

    async execute(data: RegisterUserDTO): Promise<User> {
        const locale = data.locale || "pt";
        const existingUser = await this.userRepo.findByEmail(data.email);
        
        if (existingUser) {
            throw new Error(t(locale, "auth.userAlreadyExists"));
        }

        const user = new User();
        user.name = data.name;
        user.email = data.email;
        if (data.googleId) {
            user.googleId = data.googleId;
        }

        if (data.password) {
            user.password = await bcrypt.hash(data.password, 10);
        }

        return await this.userRepo.save(user);
    }
}
