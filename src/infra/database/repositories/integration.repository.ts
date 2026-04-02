import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Integration } from "../entities/integration.entity";
import { IIntegrationRepository } from "../../../usecase/repositories/iintegration-repository";

export class IntegrationRepository implements IIntegrationRepository {
    private repo: Repository<Integration>;

    constructor() {
        this.repo = AppDataSource.getRepository(Integration);
    }

    async save(integration: Partial<Integration>): Promise<Integration> {
        return this.repo.save(integration);
    }

    async findByUserAndProvider(userId: string, provider: string): Promise<Integration | null> {
        return this.repo.findOne({
            where: { userId, provider }
        });
    }

    async delete(userId: string, provider: string): Promise<void> {
        await this.repo.delete({ userId, provider });
    }
}
