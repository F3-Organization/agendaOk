import { IUserRepository } from "../repositories/iuser-repository";
import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { AppError } from "../../shared/errors/app-error";
import { UserConfigDTO } from "../../../shared/schemas/user.schema";

export class GetUserConfigUseCase {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly userConfigRepo: IUserConfigRepository
    ) {}

    async execute(userId: string): Promise<UserConfigDTO> {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new AppError("Usuário não encontrado", 404);
        }

        const config = await this.userConfigRepo.findByUserId(userId);

        return {
            name: user.name,
            email: user.email,
            whatsappNumber: config?.whatsappNumber,
            taxId: config?.taxId,
            silentWindowStart: config?.silentWindowStart ?? "22:00",
            silentWindowEnd: config?.silentWindowEnd ?? "08:00",
            syncEnabled: config?.syncEnabled ?? true,
        };
    }
}
