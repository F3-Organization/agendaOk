import { ICompanyConfigRepository } from "../../repositories/icompany-config-repository";
import { IEvolutionService } from "../../ports/ievolution-service";
import { KeywordDetectorService } from "../keyword-detector.service";
import { PhoneNormalizerService } from "../phone-normalizer.service";
import { CompanyConfig } from "../../../infra/database/entities/company-config.entity";
import { t, type Locale } from "../../../shared/i18n";
import { EvolutionWebhookPayload } from "../../../../../shared/schemas/evolution.schema";

export class SystemBotHandler {
    constructor(
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly evolutionService: IEvolutionService,
        private readonly keywordDetector: KeywordDetectorService,
        private readonly phoneNormalizer: PhoneNormalizerService
    ) {}

    async handle(
        instanceName: string,
        phoneNumber: string,
        fullJid: string,
        text: string,
        stanzaId?: string,
        quotedText?: string
    ): Promise<void> {
        const uuidRegex = /([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/;

        const fullSearchText = `${text} ${quotedText || ""}`;
        const match = fullSearchText.match(uuidRegex);

        if (!this.keywordDetector.isConfirmation(text) && !match) return;

        let config: CompanyConfig | null = null;

        // 1. Try UUID match
        if (match && match[1]) {
            const configId = match[1];
            config = await this.companyConfigRepository.findByCompanyId(configId);

            if (config && (!config.whatsappLid || config.whatsappLid !== fullJid)) {
                await this.companyConfigRepository.updateByCompanyId(config.companyId, { whatsappLid: fullJid });
            }
        }

        // 2. Try stanzaId match
        if (!config && stanzaId) {
            config = await this.companyConfigRepository.findByLastMessageId(stanzaId);
            if (config && (!config.whatsappLid || config.whatsappLid !== fullJid)) {
                await this.companyConfigRepository.updateByCompanyId(config.companyId, { whatsappLid: fullJid });
            }
        }

        // 3. Try LID or phone number lookup
        if (!config) {
            if (fullJid.includes("@lid")) {
                config = await this.companyConfigRepository.findByWhatsappLid(fullJid);
            } else {
                config = await this.companyConfigRepository.findByWhatsappNumber(phoneNumber);
            }

            if (!config) {
                config = await this.companyConfigRepository.findByWhatsappNumber(phoneNumber);
            }

            if (config) {
                await this.companyConfigRepository.updateByCompanyId(config.companyId, { whatsappLid: fullJid });
            }
        }

        // 4. Send response
        if (config) {
            const target = config.whatsappNumber?.startsWith("55")
                ? config.whatsappNumber
                : `55${config.whatsappNumber}`;
            await this.evolutionService.sendText(
                instanceName,
                target || phoneNumber,
                t("pt", "whatsapp.activationSuccess")
            );
        } else if (match) {
            await this.evolutionService.sendText(
                instanceName,
                phoneNumber,
                t("pt", "whatsapp.activationInvalid")
            );
        }
    }
}
