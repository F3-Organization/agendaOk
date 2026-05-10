import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { CompanyConfig } from "../entities/company-config.entity";
import { ICompanyConfigRepository } from "../../../usecase/repositories/icompany-config-repository";

export class CompanyConfigRepository implements ICompanyConfigRepository {
    private repository: Repository<CompanyConfig>;

    constructor() {
        this.repository = AppDataSource.getRepository(CompanyConfig);
    }

    async save(config: CompanyConfig): Promise<CompanyConfig> {
        return await this.repository.save(config);
    }

    async findByCompanyId(companyId: string): Promise<CompanyConfig | null> {
        return await this.repository.findOneBy({ companyId });
    }

    async findByInstanceName(instanceName: string): Promise<CompanyConfig | null> {
        return await this.repository.findOneBy({ whatsappInstanceName: instanceName });
    }

    async findByWhatsappNumber(number: string): Promise<CompanyConfig | null> {
        return await this.repository.findOneBy({ whatsappNumber: number });
    }

    async findByLastMessageId(messageId: string): Promise<CompanyConfig | null> {
        return await this.repository.findOneBy({ lastMessageId: messageId });
    }

    async findAllActive(): Promise<CompanyConfig[]> {
        return await this.repository.find({
            where: { syncEnabled: true }
        });
    }

    async updateByCompanyId(companyId: string, data: Partial<CompanyConfig>): Promise<void> {
        await this.repository.update({ companyId }, data);
    }

    async deleteByCompanyId(companyId: string): Promise<void> {
        await this.repository.delete({ companyId });
    }
}
