import { ICompanyMemberRepository } from "../repositories/icompany-member-repository";
import { IUserRepository } from "../repositories/iuser-repository";
import { CompanyMember } from "../../infra/database/entities/company-member.entity";
import { User } from "../../infra/database/entities/user.entity";
import { SendEmailVerificationUseCase } from "../auth/send-email-verification.usecase";
import { AppError } from "../../shared/errors/app-error";
import { t, type Locale } from "../../shared/i18n";

export class InviteAttendantUseCase {
    constructor(
        private readonly companyMemberRepository: ICompanyMemberRepository,
        private readonly userRepository: IUserRepository,
        private readonly sendEmailVerification: SendEmailVerificationUseCase
    ) {}

    async execute(companyId: string, email: string, locale: Locale = "pt"): Promise<{ status: "INVITED" }> {
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser && existingUser.role !== "ATTENDANT") {
            throw new AppError(t(locale, "attendant.emailAlreadyExists"), 400);
        }

        let userId: string | undefined;

        if (!existingUser) {
            const newUser = new User();
            newUser.email = email;
            newUser.name = email.split("@")[0] ?? "Attendant";
            newUser.role = "ATTENDANT";
            const saved = await this.userRepository.save(newUser);
            userId = saved.id;
        } else {
            userId = existingUser.id;
        }

        // Check if member already exists for this company
        const existing = await this.companyMemberRepository.findByUserIdAndCompanyId(userId, companyId);
        if (existing) {
            throw new AppError(t(locale, "attendant.alreadyMember"), 400);
        }

        const member = new CompanyMember();
        member.companyId = companyId;
        member.userId = userId;
        member.invitedEmail = email;
        member.role = "ATTENDANT";
        await this.companyMemberRepository.save(member);

        await this.sendEmailVerification.execute(email);

        return { status: "INVITED" };
    }
}
