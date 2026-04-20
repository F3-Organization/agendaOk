import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Professional } from "../entities/professional.entity";
import { IProfessionalRepository } from "../../../usecase/repositories/iprofessional-repository";

export class ProfessionalRepository implements IProfessionalRepository {
    private repository: Repository<Professional>;

    constructor() {
        this.repository = AppDataSource.getRepository(Professional);
    }

    async save(professional: Professional): Promise<Professional> {
        return await this.repository.save(professional);
    }

    async findById(id: string, companyId: string): Promise<Professional | null> {
        return await this.repository.findOneBy({ id, companyId });
    }

    async findByCompanyId(companyId: string): Promise<Professional[]> {
        return await this.repository.find({
            where: { companyId },
            order: { name: "ASC" }
        });
    }

    async findActiveByCompanyId(companyId: string): Promise<Professional[]> {
        return await this.repository.find({
            where: { companyId, active: true },
            order: { name: "ASC" }
        });
    }

    async update(id: string, companyId: string, data: Partial<Professional>): Promise<void> {
        await this.repository.update({ id, companyId }, data);
    }

    async delete(id: string, companyId: string): Promise<void> {
        await this.repository.delete({ id, companyId });
    }
}
