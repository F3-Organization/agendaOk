import { Plan } from "../../infra/database/entities/plan.entity";

export interface IPlanRepository {
    findAll(): Promise<Plan[]>;
    findActive(): Promise<Plan[]>;
    findBySlug(slug: string): Promise<Plan | null>;
    findPurchasable(): Promise<Plan | null>;
    save(plan: Partial<Plan>): Promise<Plan>;
    delete(id: string): Promise<void>;
}
