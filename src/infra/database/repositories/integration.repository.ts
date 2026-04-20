import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Integration } from "../entities/integration.entity";
import { IIntegrationRepository } from "../../../usecase/repositories/iintegration-repository";
import { encrypt, decrypt } from "../../../shared/utils/cryptography";

export class IntegrationRepository implements IIntegrationRepository {
    private repo: Repository<Integration>;

    constructor() {
        this.repo = AppDataSource.getRepository(Integration);
    }

    async save(integration: Partial<Integration>): Promise<Integration> {
        const toSave = { ...integration };
        if (toSave.accessToken) toSave.accessToken = encrypt(toSave.accessToken);
        if (toSave.refreshToken) toSave.refreshToken = encrypt(toSave.refreshToken);
        const saved = await this.repo.save(toSave);
        return this.decrypt(saved);
    }

    async findByCompanyAndProvider(companyId: string, provider: string): Promise<Integration | null> {
        const integration = await this.repo.findOne({ where: { companyId, provider } });
        if (!integration) return null;
        return this.decrypt(integration);
    }

    async delete(companyId: string, provider: string): Promise<void> {
        await this.repo.delete({ companyId, provider });
    }

    private decrypt(integration: Integration): Integration {
        integration.accessToken = decrypt(integration.accessToken);
        if (integration.refreshToken) integration.refreshToken = decrypt(integration.refreshToken);
        return integration;
    }
}
