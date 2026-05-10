import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { SubscriptionPayment, SubscriptionPaymentStatus } from "../entities/subscription-payment.entity";
import { ISubscriptionPaymentRepository } from "../../../usecase/repositories/isubscription-payment-repository";

export class SubscriptionPaymentRepository implements ISubscriptionPaymentRepository {
    private readonly repository: Repository<SubscriptionPayment>;

    constructor() {
        this.repository = AppDataSource.getRepository(SubscriptionPayment);
    }

    async create(payment: Partial<SubscriptionPayment>): Promise<SubscriptionPayment> {
        const newPayment = this.repository.create(payment);
        return await this.repository.save(newPayment);
    }

    async update(id: string, data: Partial<SubscriptionPayment>): Promise<void> {
        await this.repository.update(id, data);
    }

    async findById(id: string): Promise<SubscriptionPayment | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async findByBillingId(billingId: string): Promise<SubscriptionPayment | null> {
        return await this.repository.findOne({ where: { billingId } });
    }

    async findAllBySubscriptionId(subscriptionId: string): Promise<SubscriptionPayment[]> {
        return await this.repository.find({ 
            where: { subscriptionId },
            order: { createdAt: "DESC" }
        });
    }

    async findPendingByUser(subscriptionId: string): Promise<SubscriptionPayment | null> {
        return await this.repository.findOne({ 
            where: { 
                subscriptionId, 
                status: SubscriptionPaymentStatus.PENDING 
            } 
        });
    }
}
