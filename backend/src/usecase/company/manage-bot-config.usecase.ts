import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { CompanyConfig } from "../../infra/database/entities/company-config.entity";
import { t, type Locale } from "../../shared/i18n";

interface UpdateBotConfigInput {
    companyId: string;
    locale?: Locale;
    businessType?: string | null;
    businessDescription?: string | null;
    botGreeting?: string | null;
    botInstructions?: string | null;
    address?: string | null;
    workingHours?: Record<string, Array<{ start: string; end: string }>> | null;
    servicesOffered?: string[] | null;
    botEnabled?: boolean | undefined;
}

const DEFAULT_BOT_GREETING = "Olá! 👋 Seja bem-vindo(a)! Como posso ajudá-lo(a) hoje?";
const DEFAULT_BOT_INSTRUCTIONS = "Seja cordial e atencioso. Ajude o cliente com informações sobre serviços, horários e agendamentos.";

export class ManageBotConfigUseCase {
    constructor(
        private readonly companyConfigRepository: ICompanyConfigRepository
    ) {}

    async get(companyId: string): Promise<Record<string, unknown> | null> {
        const config = await this.companyConfigRepository.findByCompanyId(companyId);
        if (!config) return null;

        return {
            businessType: config.businessType || "",
            businessDescription: config.businessDescription || "",
            botGreeting: config.botGreeting || DEFAULT_BOT_GREETING,
            botInstructions: config.botInstructions || DEFAULT_BOT_INSTRUCTIONS,
            address: config.address || "",
            workingHours: config.workingHours || {},
            servicesOffered: config.servicesOffered || [],
            botEnabled: config.botEnabled ?? true,
            hasWhatsappNumber: !!config.whatsappNumber,
            hasBusinessDescription: !!config.businessDescription?.trim(),
        };
    }

    async update(input: UpdateBotConfigInput): Promise<void> {
        const locale = input.locale || "pt";
        const config = await this.companyConfigRepository.findByCompanyId(input.companyId);
        if (!config) {
            throw new Error(t(locale, "company.configNotFound"));
        }

        // Validate prerequisites when enabling the bot
        if (input.botEnabled === true) {
            const effectiveDescription = input.businessDescription !== undefined
                ? input.businessDescription
                : config.businessDescription;

            if (!config.whatsappNumber) {
                throw new Error(t(locale, "bot.whatsappRequired"));
            }
            if (!effectiveDescription?.trim()) {
                throw new Error(t(locale, "bot.descriptionRequired"));
            }
        }

        const data: Partial<CompanyConfig> = {};
        if (input.businessType !== undefined) data.businessType = input.businessType ?? "";
        if (input.businessDescription !== undefined) data.businessDescription = input.businessDescription ?? "";
        if (input.botGreeting !== undefined) data.botGreeting = input.botGreeting ?? "";
        if (input.botInstructions !== undefined) data.botInstructions = input.botInstructions ?? "";
        if (input.address !== undefined) data.address = input.address ?? "";
        if (input.workingHours !== undefined) data.workingHours = input.workingHours ?? {};
        if (input.servicesOffered !== undefined) data.servicesOffered = input.servicesOffered ?? [];
        if (input.botEnabled !== undefined) data.botEnabled = input.botEnabled;

        await this.companyConfigRepository.updateByCompanyId(input.companyId, data);
    }
}
