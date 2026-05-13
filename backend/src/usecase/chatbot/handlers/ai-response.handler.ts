import { ICompanyRepository } from "../../repositories/icompany-repository";
import { IProfessionalRepository } from "../../repositories/iprofessional-repository";
import { IEvolutionService } from "../../ports/ievolution-service";
import { GeminiAdapter } from "../../../infra/adapters/gemini.adapter";
import { ConversationService } from "../conversation.service";
import { CompanyConfig } from "../../../infra/database/entities/company-config.entity";

export class AIResponseHandler {
    constructor(
        private readonly companyRepository: ICompanyRepository,
        private readonly professionalRepository: IProfessionalRepository,
        private readonly evolutionService: IEvolutionService,
        private readonly geminiAdapter: GeminiAdapter,
        private readonly conversationService: ConversationService
    ) {}

    async handle(
        config: CompanyConfig,
        instanceName: string,
        senderNumber: string,
        fullJid: string,
        text: string
    ): Promise<void> {
        const company = await this.companyRepository.findById(config.companyId);
        const companyName = company?.name || "Empresa";

        const professionals = await this.professionalRepository.findActiveByCompanyId(config.companyId);

        const history = await this.conversationService.getHistory(config.companyId, senderNumber);

        const response = await this.geminiAdapter.chat(
            config,
            companyName,
            professionals,
            history,
            text
        );

        await this.conversationService.addMessages(config.companyId, senderNumber, text, response.text);

        await this.evolutionService.sendText(instanceName, fullJid, response.text);
    }
}
