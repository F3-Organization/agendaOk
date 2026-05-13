import { CompanyMember } from "../../infra/database/entities/company-member.entity";

export interface ICompanyMemberRepository {
    save(member: CompanyMember): Promise<CompanyMember>;
    findByUserIdAndCompanyId(userId: string, companyId: string): Promise<CompanyMember | null>;
    findAllByUserId(userId: string): Promise<CompanyMember[]>;
    findAllByInvitedEmail(email: string): Promise<CompanyMember[]>;
    findByCompanyId(companyId: string): Promise<CompanyMember[]>;
    update(id: string, data: Partial<CompanyMember>): Promise<void>;
    delete(id: string, companyId: string): Promise<void>;
}
