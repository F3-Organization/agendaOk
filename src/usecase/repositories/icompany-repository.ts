import { Company } from "../../infra/database/entities/company.entity";

export interface ICompanyRepository {
    save(company: Company): Promise<Company>;
    findById(id: string): Promise<Company | null>;
    findByOwnerId(ownerId: string): Promise<Company[]>;
    findBySlug(slug: string): Promise<Company | null>;
    update(id: string, data: Partial<Company>): Promise<void>;
    delete(id: string): Promise<void>;
}
