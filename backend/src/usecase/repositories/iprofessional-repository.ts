import { Professional } from "../../infra/database/entities/professional.entity";

export interface IProfessionalRepository {
    save(professional: Professional): Promise<Professional>;
    findById(id: string, companyId: string): Promise<Professional | null>;
    findByCompanyId(companyId: string): Promise<Professional[]>;
    findActiveByCompanyId(companyId: string): Promise<Professional[]>;
    update(id: string, companyId: string, data: Partial<Professional>): Promise<void>;
    delete(id: string, companyId: string): Promise<void>;
}
