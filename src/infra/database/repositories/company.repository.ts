import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Company } from "../entities/company.entity";
import { ICompanyRepository } from "../../../usecase/repositories/icompany-repository";

export class CompanyRepository implements ICompanyRepository {
    private repository: Repository<Company>;

    constructor() {
        this.repository = AppDataSource.getRepository(Company);
    }

    async save(company: Company): Promise<Company> {
        return await this.repository.save(company);
    }

    async findById(id: string): Promise<Company | null> {
        return await this.repository.findOneBy({ id });
    }

    async findByOwnerId(ownerId: string): Promise<Company[]> {
        return await this.repository.find({ where: { ownerId }, order: { createdAt: "ASC" } });
    }

    async findBySlug(slug: string): Promise<Company | null> {
        return await this.repository.findOneBy({ slug });
    }

    async update(id: string, data: Partial<Company>): Promise<void> {
        await this.repository.update(id, data);
    }
}
