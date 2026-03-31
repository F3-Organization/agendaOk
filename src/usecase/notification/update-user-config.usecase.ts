import { IUserConfigRepository } from "../repositories/iuser-config-repository";

export interface UpdateUserConfigDTO {
    whatsappNumber?: string | undefined;
    syncEnabled?: boolean | undefined;
    silentWindowStart?: string | undefined;
    silentWindowEnd?: string | undefined;
}

export class UpdateUserConfigUseCase {
    constructor(private readonly userConfigRepo: IUserConfigRepository) {}

    async execute(userId: string, data: UpdateUserConfigDTO): Promise<void> {
        const config = await this.userConfigRepo.findByUserId(userId);
        
        if (!config) {
            // If it doesn't exist, we create one (e.g. for Google users who haven't synced yet)
            await this.userConfigRepo.save({
                userId,
                ...data
            } as any);
            return;
        }

        await this.userConfigRepo.update(userId, data as any);
    }
}
