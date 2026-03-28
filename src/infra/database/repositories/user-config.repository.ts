import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { UserConfig } from "../entities/user-config.entity";
import { IUserConfigRepository } from "../../../usecase/repositories/iuser-config-repository";

export class UserConfigRepository implements IUserConfigRepository {
    private repository: Repository<UserConfig>;

    constructor() {
        this.repository = AppDataSource.getRepository(UserConfig);
    }

    async save(config: UserConfig): Promise<UserConfig> {
        return await this.repository.save(config);
    }

    async findByUserId(userId: string): Promise<UserConfig | null> {
        return await this.repository.findOneBy({ userId });
    }

    async findByInstanceName(instanceName: string): Promise<UserConfig | null> {
        return await this.repository.findOneBy({ whatsappInstanceName: instanceName });
    }

    async findAllActive(): Promise<UserConfig[]> {
        return await this.repository.find({ where: { syncEnabled: true } });
    }

    async update(userId: string, data: Partial<UserConfig>): Promise<void> {
        await this.repository.update({ userId }, data);
    }
}
