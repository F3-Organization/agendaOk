import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Plan } from "../entities/plan.entity";
import { IPlanRepository } from "../../../usecase/repositories/iplan-repository";

export class PlanRepository implements IPlanRepository {
    private repo: Repository<Plan>;

    constructor() {
        this.repo = AppDataSource.getRepository(Plan);
    }

    async findAll(): Promise<Plan[]> {
        return this.repo.find({ order: { sortOrder: "ASC" } });
    }

    async findActive(): Promise<Plan[]> {
        return this.repo.find({ where: { isActive: true }, order: { sortOrder: "ASC" } });
    }

    async findBySlug(slug: string): Promise<Plan | null> {
        return this.repo.findOne({ where: { slug } });
    }

    async findPurchasable(): Promise<Plan | null> {
        return this.repo.findOne({ where: { isPurchasable: true, isActive: true }, order: { sortOrder: "ASC" } });
    }

    async save(plan: Partial<Plan>): Promise<Plan> {
        return this.repo.save(plan);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
