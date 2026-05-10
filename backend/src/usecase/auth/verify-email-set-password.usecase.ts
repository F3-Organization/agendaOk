import { UserRepository } from "../../infra/database/repositories/user.repository";
import { RedisService } from "../../infra/database/redis.service";
import * as bcrypt from "bcrypt";
import { User } from "../../infra/database/entities/user.entity";

export class VerifyEmailSetPasswordUseCase {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly redisService: RedisService
    ) {}

    async execute(email: string, code: string, password: string): Promise<User> {
        const storedCode = await this.redisService.get(`verify_email:${email}`);

        if (!storedCode || storedCode !== code) {
            throw new Error("Invalid or expired verification code.");
        }

        const user = await this.userRepo.findByEmail(email);
        if (!user) {
            throw new Error("User not found.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;

        await this.userRepo.save(user);
        await this.redisService.del(`verify_email:${email}`);

        console.log(`[VerifyEmailSetPasswordUseCase] Password set successfully for ${email}`);
        return user;
    }
}
