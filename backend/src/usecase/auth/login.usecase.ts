import { IUserRepository } from "../repositories/iuser-repository";
import { User } from "../../infra/database/entities/user.entity";
import * as bcrypt from "bcrypt";

export class LoginUseCase {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(email: string, password: string): Promise<User> {
        const user = await this.userRepo.findByEmail(email);
        
        if (!user || !user.password) {
            throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) {
            throw new Error("Invalid credentials");
        }

        return user;
    }
}
