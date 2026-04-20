import { CompanyConfig } from "../../infra/database/entities/company-config.entity";

export interface ICompanyConfigRepository {
    save(config: CompanyConfig): Promise<CompanyConfig>;
    findByCompanyId(companyId: string): Promise<CompanyConfig | null>;
    findByInstanceName(instanceName: string): Promise<CompanyConfig | null>;
    findByWhatsappNumber(number: string): Promise<CompanyConfig | null>;
    findByLastMessageId(messageId: string): Promise<CompanyConfig | null>;
    findAllActive(): Promise<CompanyConfig[]>;
    updateByCompanyId(companyId: string, data: Partial<CompanyConfig>): Promise<void>;
    deleteByCompanyId(companyId: string): Promise<void>;
}
