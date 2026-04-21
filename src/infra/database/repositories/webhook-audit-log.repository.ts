import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { WebhookAuditLog } from "../entities/webhook-audit-log.entity";

export class WebhookAuditLogRepository {
    private readonly repository: Repository<WebhookAuditLog>;

    constructor() {
        this.repository = AppDataSource.getRepository(WebhookAuditLog);
    }

    async create(data: Partial<WebhookAuditLog>): Promise<WebhookAuditLog> {
        const entry = this.repository.create(data);
        return this.repository.save(entry);
    }

    async findByBillingId(billingId: string): Promise<WebhookAuditLog[]> {
        return this.repository.find({
            where: { billingId },
            order: { createdAt: "DESC" }
        });
    }

    async findByUserId(userId: string): Promise<WebhookAuditLog[]> {
        return this.repository.find({
            where: { userId },
            order: { createdAt: "DESC" }
        });
    }
}
