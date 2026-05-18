import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Lead } from "../entities/lead.entity";

export class LeadRepository {
    private repository: Repository<Lead>;

    constructor() {
        this.repository = AppDataSource.getRepository(Lead);
    }

    async create(data: { name: string; email: string; phone?: string | undefined; source?: string | undefined }): Promise<Lead> {
        const lead = this.repository.create(data);
        return this.repository.save(lead);
    }

    async findByEmail(email: string): Promise<Lead | null> {
        return this.repository.findOne({ where: { email } });
    }

    async findAll(): Promise<Lead[]> {
        return this.repository.find({ order: { createdAt: "DESC" } });
    }

    async count(): Promise<number> {
        return this.repository.count();
    }
}
