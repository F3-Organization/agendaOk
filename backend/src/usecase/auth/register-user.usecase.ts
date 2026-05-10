import { IUserRepository } from "../repositories/iuser-repository";
import { User } from "../../infra/database/entities/user.entity";
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
        private readonly userRepo: IUserRepository
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

        return await this.userRepo.save(user);
    }
}
