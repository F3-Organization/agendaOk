import { ICompanyMemberRepository } from "../repositories/icompany-member-repository";
import { IUserRepository } from "../repositories/iuser-repository";
import { CompanyMember } from "../../infra/database/entities/company-member.entity";
import { User } from "../../infra/database/entities/user.entity";
import { SendEmailVerificationUseCase } from "../auth/send-email-verification.usecase";
import { AppError } from "../../shared/errors/app-error";
import { t, type Locale } from "../../shared/i18n";

export interface AttendantListItem {
    id: string;
    email: string;
    name: string;
    userId?: string;
    createdAt: string;
}

export class InviteAttendantUseCase {
    constructor(
        private readonly companyMemberRepository: ICompanyMemberRepository,
        private readonly userRepository: IUserRepository,
        private readonly sendEmailVerification: SendEmailVerificationUseCase
    ) {}

    async list(companyId: string): Promise<AttendantListItem[]> {
        const members = await this.companyMemberRepository.findByCompanyId(companyId);
        const items: AttendantListItem[] = [];

        for (const member of members) {
            let email = member.invitedEmail ?? "";
            let name = "";

            if (member.userId) {
                const user = await this.userRepository.findById(member.userId);
                if (user) {
                    email = user.email;
                    name = user.name;
                }
            }

            items.push({
                id: member.id,
                email,
                name: name || (email.split("@")[0] ?? "Atendente"),
                userId: member.userId,
                createdAt: member.createdAt.toISOString(),
            });
        }

        return items;
    }

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

        // Fire-and-forget: don't block invite on email delivery
        this.sendEmailVerification.execute(email).catch((err) => {
            console.warn(`[InviteAttendant] Failed to send email to ${email}:`, err.message);
        });

        return { status: "INVITED" };
    }

    async remove(memberId: string, companyId: string, locale: Locale = "pt"): Promise<void> {
        await this.companyMemberRepository.delete(memberId, companyId);
    }
}

