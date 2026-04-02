import { authenticator } from "otplib";
import { IUserRepository } from "../repositories/iuser-repository";

export interface Toggle2FAResponse {
    otpauthUrl?: string | undefined;
    secret?: string | undefined;
}

export class Toggle2FAUseCase {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(userId: string, enabled: boolean): Promise<Toggle2FAResponse> {
        const user = await this.userRepo.findById(userId);
        
        if (!user) {
            throw new Error("Usuário não encontrado");
        }

        // If disabling, just turn it off
        if (!enabled) {
            user.twoFactorEnabled = false;
            await this.userRepo.save(user);
            return {};
        }

        // If enabling, we keep it as 'false' until verified, but we generate the secret
        // Actually, the user wants to "Turn on", so we can set it to false and wait for verification?
        // Let's generate a new secret if it doesn't exist
        if (!user.twoFactorSecret) {
            user.twoFactorSecret = authenticator.generateSecret();
            await this.userRepo.save(user);
        }

        const otpauthUrl = authenticator.keyuri(
            user.email,
            "AgendaOk",
            user.twoFactorSecret
        );

        return {
            otpauthUrl,
            secret: user.twoFactorSecret
        };
    }
}
