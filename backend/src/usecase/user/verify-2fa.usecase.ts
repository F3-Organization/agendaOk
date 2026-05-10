import { authenticator } from "otplib";
import { IUserRepository } from "../repositories/iuser-repository";
import { AppError } from "../../shared/errors/app-error";

export class Verify2FAUseCase {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(userId: string, token: string): Promise<void> {
        const user = await this.userRepo.findById(userId);
        
        if (!user) {
            throw new AppError("Usuário não encontrado", 404);
        }

        if (!user.twoFactorSecret) {
            throw new AppError("2FA não configurado para este usuário", 400);
        }

        const isValid = authenticator.verify({
            token,
            secret: user.twoFactorSecret
        });

        if (!isValid) {
            throw new AppError("Token inválido", 400);
        }

        user.twoFactorEnabled = true;
        await this.userRepo.save(user);
    }
}
