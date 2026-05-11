import { IProfessionalRepository } from "../repositories/iprofessional-repository";
import { IUserRepository } from "../repositories/iuser-repository";
import { User } from "../../infra/database/entities/user.entity";
import { SendEmailVerificationUseCase } from "../auth/send-email-verification.usecase";
import { AppError } from "../../shared/errors/app-error";

export class InviteProfessionalUserUseCase {
    constructor(
        private readonly professionalRepository: IProfessionalRepository,
        private readonly userRepository: IUserRepository,
        private readonly sendEmailVerification: SendEmailVerificationUseCase
    ) {}

    async execute(professionalId: string, companyId: string, email: string): Promise<{ status: "INVITED" }> {
        const professional = await this.professionalRepository.findById(professionalId, companyId);
        if (!professional) throw new AppError("Profissional não encontrado", 404);
        if (professional.userId) throw new AppError("Profissional já possui conta vinculada", 400);

        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser && existingUser.role !== "PROFESSIONAL") {
            throw new AppError("Este email já pertence a uma conta existente", 400);
        }

        if (!existingUser) {
            const newUser = new User();
            newUser.email = email;
            newUser.name = professional.name;
            newUser.role = "PROFESSIONAL";
            await this.userRepository.save(newUser);
        }

        // Overwrite any previous invite — allows correcting a wrong email
        await this.professionalRepository.update(professionalId, companyId, { invitedEmail: email });
        await this.sendEmailVerification.execute(email);

        return { status: "INVITED" };
    }
}
