import { Integration } from "../../infra/database/entities/integration.entity";

export interface IIntegrationRepository {
    save(integration: Partial<Integration>): Promise<Integration>;
    findByCompanyAndProvider(companyId: string, provider: string): Promise<Integration | null>;
    delete(companyId: string, provider: string): Promise<void>;
}
