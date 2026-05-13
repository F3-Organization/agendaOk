import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { CompanyMember } from "../entities/company-member.entity";
import { ICompanyMemberRepository } from "../../../usecase/repositories/icompany-member-repository";

export class CompanyMemberRepository implements ICompanyMemberRepository {
    private repository: Repository<CompanyMember>;

    constructor() {
        this.repository = AppDataSource.getRepository(CompanyMember);
    }

    async save(member: CompanyMember): Promise<CompanyMember> {
        return await this.repository.save(member);
    }

    async findByUserIdAndCompanyId(userId: string, companyId: string): Promise<CompanyMember | null> {
        return await this.repository.findOneBy({ userId, companyId });
    }

    async findAllByUserId(userId: string): Promise<CompanyMember[]> {
        return await this.repository.find({ where: { userId }, relations: ["company"] });
    }

    async findAllByInvitedEmail(email: string): Promise<CompanyMember[]> {
        return await this.repository.find({ where: { invitedEmail: email }, relations: ["company"] });
    }

    async findByCompanyId(companyId: string): Promise<CompanyMember[]> {
        return await this.repository.find({
            where: { companyId },
            order: { createdAt: "ASC" },
        });
    }

    async update(id: string, data: Partial<CompanyMember>): Promise<void> {
        await this.repository.update({ id }, data);
    }

    async delete(id: string, companyId: string): Promise<void> {
        await this.repository.delete({ id, companyId });
    }
}
