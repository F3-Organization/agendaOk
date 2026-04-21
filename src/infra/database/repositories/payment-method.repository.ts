import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { PaymentMethod } from "../entities/payment-method.entity";

export class PaymentMethodRepository {
    private readonly repository: Repository<PaymentMethod>;

    constructor() {
        this.repository = AppDataSource.getRepository(PaymentMethod);
    }

    async findAll(): Promise<PaymentMethod[]> {
        return this.repository.find({ where: { isActive: true }, order: { name: "ASC" } });
    }

    async findByCode(code: string): Promise<PaymentMethod | null> {
        return this.repository.findOne({ where: { code } });
    }

    async upsert(data: Pick<PaymentMethod, 'code' | 'name' | 'description'>[]): Promise<void> {
        await this.repository
            .createQueryBuilder()
            .insert()
            .into(PaymentMethod)
            .values(data)
            .orUpdate(['name', 'description'], ['code'])
            .execute();
    }
}
