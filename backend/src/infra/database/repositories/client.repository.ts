import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Client } from "../entities/client.entity";
import { IClientRepository } from "../../../usecase/repositories/iclient-repository";

export class ClientRepository implements IClientRepository {
    private repository: Repository<Client>;

    constructor() {
        this.repository = AppDataSource.getRepository(Client);
    }

    async save(client: Client): Promise<Client> {
        return await this.repository.save(client);
    }

    async findById(id: string, companyId: string): Promise<Client | null> {
        return await this.repository.findOne({ where: { id, companyId } });
    }

    async findByCompanyId(companyId: string): Promise<Client[]> {
        return await this.repository.find({ where: { companyId } });
    }

    async findByNameOrEmail(companyId: string, term: string): Promise<Client | null> {
        return await this.repository.findOne({
            where: [
                { companyId, name: term },
                { companyId, email: term },
            ],
        });
    }

    async findByPhone(companyId: string, phone: string): Promise<Client | null> {
        return await this.repository.findOne({ where: { companyId, phone } });
    }
}
