import { Integration } from "../../infra/database/entities/integration.entity";

export interface IIntegrationRepository {
    save(integration: Partial<Integration>): Promise<Integration>;
    findByUserAndProvider(userId: string, provider: string): Promise<Integration | null>;
    delete(userId: string, provider: string): Promise<void>;
}
