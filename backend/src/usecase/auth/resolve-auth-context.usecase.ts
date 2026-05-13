import { ITokenService } from "../ports/itoken-service";
import { ICompanyRepository } from "../repositories/icompany-repository";
import { IProfessionalRepository } from "../repositories/iprofessional-repository";
import { ICompanyMemberRepository } from "../repositories/icompany-member-repository";
import { User } from "../../infra/database/entities/user.entity";
import { AppError } from "../../shared/errors/app-error";
import { t, type Locale } from "../../shared/i18n";

interface AuthContextInput {
    user: User;
    message: string;
    companyId?: string | undefined;
    locale?: Locale;
}

interface AuthContextCompany {
    id: string;
    name: string;
    professionalId?: string;
}

interface AuthContextUser {
    id: string;
    name: string;
    email: string;
    role: string;
    hasPassword: boolean;
    companyId?: string | undefined;
    professionalId?: string | undefined;
}

export interface AuthContextResult {
    status?: "2FA_REQUIRED" | "SELECT_PROFESSIONAL_CONTEXT" | "SELECT_ATTENDANT_CONTEXT";
    message?: string;
    token?: string;
    tempToken?: string;
    user?: AuthContextUser;
    companies?: AuthContextCompany[];
}

export class ResolveAuthContextUseCase {
    constructor(
        private readonly tokenService: ITokenService,
        private readonly companyRepo: ICompanyRepository,
        private readonly professionalRepo: IProfessionalRepository,
        private readonly companyMemberRepo: ICompanyMemberRepository
    ) {}

    async execute(input: AuthContextInput): Promise<AuthContextResult> {
        const { user, message, companyId } = input;
        const locale = input.locale ?? "pt";

        // 2FA pending
        if (user.twoFactorEnabled) {
            const tempToken = this.tokenService.sign(
                { id: user.id, is2FAPending: true },
                { expiresIn: "5m" }
            );
            return {
                status: "2FA_REQUIRED",
                message: "Two-Factor Authentication required",
                tempToken,
            };
        }

        // PROFESSIONAL: resolve all linked professional records
        if (user.role === "PROFESSIONAL") {
            return this.resolveProfessionalContext(user, message, locale);
        }

        // ATTENDANT: resolve all linked company memberships
        if (user.role === "ATTENDANT") {
            return this.resolveAttendantContext(user, message, locale);
        }

        // Regular USER / ADMIN
        return this.resolveOwnerContext(user, message, companyId);
    }

    private async resolveProfessionalContext(user: User, message: string, locale: Locale): Promise<AuthContextResult> {
        let professionals = await this.professionalRepo.findAllByUserId(user.id);

        // First login: link userId to all professionals matching the invited email
        if (professionals.length === 0) {
            const byEmail = await this.professionalRepo.findAllByInvitedEmail(user.email);
            for (const p of byEmail) {
                await this.professionalRepo.update(p.id, p.companyId, { userId: user.id });
                p.userId = user.id;
            }
            professionals = byEmail;
        }

        if (professionals.length === 0) {
            throw new AppError(t(locale, "user.professionalNotLinked"), 403);
        }

        // Single company: auto-select
        if (professionals.length === 1) {
            const professional = professionals[0]!;
            const token = this.tokenService.sign({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                companyId: professional.companyId,
                professionalId: professional.id,
            });
            return {
                message,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    hasPassword: !!user.password,
                    companyId: professional.companyId,
                    professionalId: professional.id,
                },
                companies: [],
            };
        }

        // Multiple companies: return partial token + list for selection
        const partialToken = this.tokenService.sign({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });
        return {
            status: "SELECT_PROFESSIONAL_CONTEXT",
            token: partialToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                hasPassword: !!user.password,
            },
            companies: professionals.map(p => ({
                id: p.companyId,
                name: p.company?.name ?? p.companyId,
                professionalId: p.id,
            })),
        };
    }

    private async resolveAttendantContext(user: User, message: string, locale: Locale): Promise<AuthContextResult> {
        let members = await this.companyMemberRepo.findAllByUserId(user.id);

        // First login: link userId to all members matching the invited email
        if (members.length === 0) {
            const byEmail = await this.companyMemberRepo.findAllByInvitedEmail(user.email);
            for (const m of byEmail) {
                await this.companyMemberRepo.update(m.id, { userId: user.id });
                m.userId = user.id;
            }
            members = byEmail;
        }

        if (members.length === 0) {
            throw new AppError(t(locale, "user.attendantNotLinked"), 403);
        }

        // Single company: auto-select
        if (members.length === 1) {
            const member = members[0]!;
            const token = this.tokenService.sign({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                companyId: member.companyId,
            });
            return {
                message,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    hasPassword: !!user.password,
                    companyId: member.companyId,
                },
                companies: [],
            };
        }

        // Multiple companies: return partial token + list for selection
        const partialToken = this.tokenService.sign({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });
        return {
            status: "SELECT_ATTENDANT_CONTEXT",
            token: partialToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                hasPassword: !!user.password,
            },
            companies: members.map(m => ({
                id: m.companyId,
                name: m.company?.name ?? m.companyId,
            })),
        };
    }

    private async resolveOwnerContext(user: User, message: string, companyId?: string): Promise<AuthContextResult> {
        const companies = await this.companyRepo.findByOwnerId(user.id);
        const resolvedCompanyId = companyId || companies[0]?.id;

        const token = this.tokenService.sign({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: resolvedCompanyId || undefined,
        });

        return {
            message,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                hasPassword: !!user.password,
                companyId: resolvedCompanyId || undefined,
            },
            companies: companies.map(c => ({
                id: c.id,
                name: c.name,
            })),
        };
    }
}
