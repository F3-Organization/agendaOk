import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { UserConfig } from "../entities/user-config.entity";
import { IUserConfigRepository } from "../../../usecase/repositories/iuser-config-repository";

export class UserConfigRepository implements IUserConfigRepository {
    private repository: Repository<UserConfig>;

    constructor() {
        this.repository = AppDataSource.getRepository(UserConfig);
    }

    async save(config: Partial<UserConfig>): Promise<UserConfig> {
        return await this.repository.save(config);
    }

    async findById(id: string): Promise<UserConfig | null> {
        return await this.repository.findOneBy({ id });
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

    async findByWhatsappNumber(identifier: string): Promise<UserConfig | null> {
        if (identifier.includes("@")) {
            const lidMatch = await this.repository.findOneBy({ whatsappLid: identifier });
            if (lidMatch) return lidMatch;
        }

        const cleaned = identifier.replace(/\D/g, "");
        if (!cleaned) return null;

        const without55 = cleaned.startsWith("55") ? cleaned.substring(2) : cleaned;
        const variations = [cleaned, without55, `55${without55}`];
        
        if (without55.length >= 10 && without55.length <= 11) {
            const ddd = without55.substring(0, 2);
            const body = without55.substring(2);
            
            if (body.startsWith("9") && body.length === 9) {
                const without9 = ddd + body.substring(1);
                variations.push(without9, `55${without9}`);
            } else if (body.length === 8) {
                const with9 = ddd + "9" + body;
                variations.push(with9, `55${with9}`);
            }
        }

        return await this.repository.createQueryBuilder("config")
            .where("config.whatsapp_number IN (:...variations)", { variations })
            .orWhere("config.whatsapp_lid LIKE :identifier", { identifier: `%${identifier.split("@")[0]}%` })
            .getOne();
    }

    async findAllActive(): Promise<UserConfig[]> {
        return await this.repository.find({ where: { syncEnabled: true } });
    }

    async update(userId: string, data: Partial<UserConfig>): Promise<void> {
        await this.repository.update({ userId }, data);
    }
}
