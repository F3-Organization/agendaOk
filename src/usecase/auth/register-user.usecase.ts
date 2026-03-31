import { IUserRepository } from "../repositories/iuser-repository";
import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { User } from "../../infra/database/entities/user.entity";
import { UserConfig } from "../../infra/database/entities/user-config.entity";
import * as bcrypt from "bcrypt";

export interface RegisterUserDTO {
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    whatsappNumber: string;
}

export class RegisterUserUseCase {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly userConfigRepo: IUserConfigRepository
    ) {}

    async execute(data: RegisterUserDTO): Promise<User> {
        const existingUser = await this.userRepo.findByEmail(data.email);
        
        if (existingUser) {
            throw new Error("User already exists");
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

        const savedUser = await this.userRepo.save(user);

        // Create initial config with WhatsApp number
        const config = new UserConfig();
        config.userId = savedUser.id;
        config.whatsappNumber = data.whatsappNumber;
        config.syncEnabled = true;
        await this.userConfigRepo.save(config);

        return savedUser;
    }
}
