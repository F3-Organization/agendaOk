import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { CompanyConfig } from "../../infra/database/entities/company-config.entity";

interface UpdateBotConfigInput {
    companyId: string;
    businessType?: string | undefined;
    businessDescription?: string | undefined;
    botGreeting?: string | undefined;
    botInstructions?: string | undefined;
    address?: string | undefined;
    workingHours?: Record<string, Array<{ start: string; end: string }>> | undefined;
    servicesOffered?: string[] | undefined;
    botEnabled?: boolean | undefined;
}

export class ManageBotConfigUseCase {
    constructor(
        private readonly companyConfigRepository: ICompanyConfigRepository
    ) {}

    async get(companyId: string): Promise<Record<string, unknown> | null> {
        const config = await this.companyConfigRepository.findByCompanyId(companyId);
        if (!config) return null;

        const result: Record<string, unknown> = {};
        if (config.businessType !== undefined) result.businessType = config.businessType;
        if (config.businessDescription !== undefined) result.businessDescription = config.businessDescription;
        if (config.botGreeting !== undefined) result.botGreeting = config.botGreeting;
        if (config.botInstructions !== undefined) result.botInstructions = config.botInstructions;
        if (config.address !== undefined) result.address = config.address;
        if (config.workingHours !== undefined) result.workingHours = config.workingHours;
        if (config.servicesOffered !== undefined) result.servicesOffered = config.servicesOffered;
        if (config.botEnabled !== undefined) result.botEnabled = config.botEnabled;
        return result;
    }

    async update(input: UpdateBotConfigInput): Promise<void> {
        const config = await this.companyConfigRepository.findByCompanyId(input.companyId);
        if (!config) {
            throw new Error("Company config not found");
        }

        const data: Partial<CompanyConfig> = {};
        if (input.businessType !== undefined) data.businessType = input.businessType;
        if (input.businessDescription !== undefined) data.businessDescription = input.businessDescription;
        if (input.botGreeting !== undefined) data.botGreeting = input.botGreeting;
        if (input.botInstructions !== undefined) data.botInstructions = input.botInstructions;
        if (input.address !== undefined) data.address = input.address;
        if (input.workingHours !== undefined) data.workingHours = input.workingHours;
        if (input.servicesOffered !== undefined) data.servicesOffered = input.servicesOffered;
        if (input.botEnabled !== undefined) data.botEnabled = input.botEnabled;

        await this.companyConfigRepository.updateByCompanyId(input.companyId, data);
    }
}
