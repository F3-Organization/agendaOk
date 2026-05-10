import { UserConfig } from "../../infra/database/entities/user-config.entity";

export interface IUserConfigRepository {
    save(config: Partial<UserConfig>): Promise<UserConfig>;
    findById(id: string): Promise<UserConfig | null>;
    findByUserId(userId: string): Promise<UserConfig | null>;
    findByInstanceName(instanceName: string): Promise<UserConfig | null>;
    findByWhatsappNumber(number: string): Promise<UserConfig | null>;
    findByLastMessageId(messageId: string): Promise<UserConfig | null>;
    findAllActive(): Promise<UserConfig[]>;
    update(userId: string, data: Partial<UserConfig>): Promise<void>;
}
