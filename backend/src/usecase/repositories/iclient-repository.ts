import { Client } from "../../infra/database/entities/client.entity";

export interface IClientRepository {
    save(client: Client): Promise<Client>;
    findById(id: string, companyId: string): Promise<Client | null>;
    findByCompanyId(companyId: string): Promise<Client[]>;
    findByNameOrEmail(companyId: string, term: string): Promise<Client | null>;
    findByPhone(companyId: string, phone: string): Promise<Client | null>;
}
