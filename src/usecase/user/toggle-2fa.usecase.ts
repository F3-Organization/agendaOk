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

        // If disabling, turn it off and CLEAR the secret for security
        if (!enabled) {
            user.twoFactorEnabled = false;
            user.twoFactorSecret = null;
            await this.userRepo.save(user);
            return {};
        }

        // If already enabled, we don't allow "peeking" the current secret.
        // The user must disable it first to regenerate a new one.
        if (user.twoFactorEnabled) {
            throw new Error("2FA já está ativo. Desative primeiro para reconfigurar.");
        }

        // If enabling (setup mode), always generate a fresh secret
        user.twoFactorSecret = authenticator.generateSecret();
        await this.userRepo.save(user);

        const otpauthUrl = authenticator.keyuri(
            user.email,
            "ConfirmaZap",
            user.twoFactorSecret
        );

        return {
            otpauthUrl,
            secret: user.twoFactorSecret
        };
    }
}
