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

    async findByLastMessageId(messageId: string): Promise<UserConfig | null> {
        return await this.repository.findOneBy({ lastMessageId: messageId });
    }

    async findByWhatsappNumber(number: string): Promise<UserConfig | null> {
        const cleaned = number.replace(/\D/g, "");
        // Search for the number exactly or with/without the 55 prefix
        const numberWithout55 = cleaned.startsWith("55") ? cleaned.substring(2) : cleaned;
        
        return await this.repository.createQueryBuilder("config")
            .where("config.whatsapp_number = :number", { number: cleaned })
            .orWhere("config.whatsapp_number = :without55", { without55: numberWithout55 })
            .orWhere("config.whatsapp_number = :with55", { with55: `55${numberWithout55}` })
            .orWhere("config.whatsapp_lid = :lid", { lid: number }) // number here is the raw input
            .getOne();
    }

    async findAllActive(): Promise<UserConfig[]> {
        return await this.repository.find({ where: { syncEnabled: true } });
    }

    async update(userId: string, data: Partial<UserConfig>): Promise<void> {
        await this.repository.update({ userId }, data);
    }
}
