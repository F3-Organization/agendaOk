import { IUserRepository } from "../repositories/iuser-repository";
import * as bcrypt from "bcrypt";
import { SetPasswordDTO } from "../../../shared/schemas/user.schema";
import { AppError } from "../../shared/errors/app-error";

export class SetPasswordUseCase {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(userId: string, data: SetPasswordDTO): Promise<void> {
        const user = await this.userRepo.findById(userId);
        
        if (!user) {
            throw new AppError("Usuário não encontrado", 404);
        }

        if (user.password) {
            throw new AppError("O usuário já possui uma senha definida. Use o recurso de alterar senha.", 400);
        }

        const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);
        user.password = hashedNewPassword;

        await this.userRepo.save(user);
    }
}
