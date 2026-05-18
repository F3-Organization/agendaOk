import { AppDataSource } from "../../infra/config/data-source";
import { Lead } from "../database/entities/lead.entity";

export class LeadRepository {
    private repo = AppDataSource.getRepository(Lead);

    async create(data: { name: string; email: string; phone?: string; source?: string }): Promise<Lead> {
        const lead = this.repo.create(data);
        return this.repo.save(lead);
    }

    async findByEmail(email: string): Promise<Lead | null> {
        return this.repo.findOne({ where: { email } });
    }

    async findAll(): Promise<Lead[]> {
        return this.repo.find({ order: { createdAt: "DESC" } });
    }

    async count(): Promise<number> {
        return this.repo.count();
    }
}
