import { UserConfig } from "../../infra/database/entities/user-config.entity";

export interface IUserConfigRepository {
    save(config: UserConfig): Promise<UserConfig>;
    findByUserId(userId: string): Promise<UserConfig | null>;
    findByInstanceName(instanceName: string): Promise<UserConfig | null>;
    findAllActive(): Promise<UserConfig[]>;
    update(userId: string, data: Partial<UserConfig>): Promise<void>;
}
