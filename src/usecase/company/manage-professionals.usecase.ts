import { IProfessionalRepository } from "../repositories/iprofessional-repository";
import { Professional } from "../../infra/database/entities/professional.entity";

interface CreateProfessionalInput {
    companyId: string;
    name: string;
    specialty?: string | undefined;
    workingHours?: Record<string, Array<{ start: string; end: string }>> | undefined;
    appointmentDuration?: number | undefined;
}

interface UpdateProfessionalInput {
    id: string;
    companyId: string;
    name?: string | undefined;
    specialty?: string | undefined;
    workingHours?: Record<string, Array<{ start: string; end: string }>> | undefined;
    appointmentDuration?: number | undefined;
    active?: boolean | undefined;
}

export class ManageProfessionalsUseCase {
    constructor(
        private readonly professionalRepository: IProfessionalRepository
    ) {}

    async list(companyId: string): Promise<Professional[]> {
        return this.professionalRepository.findByCompanyId(companyId);
    }

    async create(input: CreateProfessionalInput): Promise<Professional> {
        const professional = new Professional();
        professional.companyId = input.companyId;
        professional.name = input.name;
        if (input.specialty !== undefined) professional.specialty = input.specialty;
        if (input.workingHours !== undefined) professional.workingHours = input.workingHours;
        professional.appointmentDuration = input.appointmentDuration || 60;
        professional.active = true;

        return this.professionalRepository.save(professional);
    }

    async update(input: UpdateProfessionalInput): Promise<void> {
        const existing = await this.professionalRepository.findById(input.id, input.companyId);
        if (!existing) {
            throw new Error("Professional not found");
        }

        const data: Partial<Professional> = {};
        if (input.name !== undefined) data.name = input.name;
        if (input.specialty !== undefined) data.specialty = input.specialty;
        if (input.workingHours !== undefined) data.workingHours = input.workingHours;
        if (input.appointmentDuration !== undefined) data.appointmentDuration = input.appointmentDuration;
        if (input.active !== undefined) data.active = input.active;

        await this.professionalRepository.update(input.id, input.companyId, data);
    }

    async delete(id: string, companyId: string): Promise<void> {
        const existing = await this.professionalRepository.findById(id, companyId);
        if (!existing) {
            throw new Error("Professional not found");
        }

        await this.professionalRepository.delete(id, companyId);
    }
}
