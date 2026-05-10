import { IUserRepository } from "../repositories/iuser-repository";
import { ITokenService } from "../ports/itoken-service";
import { Validate2FAUseCase } from "../user/validate-2fa.usecase";
import { User } from "../../infra/database/entities/user.entity";

export class LoginVerify2FAUseCase {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly tokenService: ITokenService,
        private readonly validate2FA: Validate2FAUseCase
    ) {}

    async execute(tempToken: string, code: string): Promise<User> {
        let decoded: any;
        try {
            decoded = this.tokenService.verify(tempToken);
        } catch (error) {
            throw new Error("Invalid or expired temporary token");
        }

        if (!decoded || !decoded.is2FAPending || !decoded.id) {
            throw new Error("Invalid temporary token structure");
        }

        const isValid = await this.validate2FA.execute(decoded.id, code);
        if (!isValid) {
            throw new Error("Invalid 2FA code");
        }

        const user = await this.userRepo.findById(decoded.id);
        if (!user) {
            throw new Error("User not found");
        }

        return user;
    }
}
