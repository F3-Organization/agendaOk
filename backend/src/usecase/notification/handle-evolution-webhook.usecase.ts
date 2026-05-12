import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { IProfessionalRepository } from "../repositories/iprofessional-repository";
import { ICompanyRepository } from "../repositories/icompany-repository";
import { IEvolutionService } from "../ports/ievolution-service";
import { EvolutionWebhookPayload } from "../../../../shared/schemas/evolution.schema";
import { env } from "../../infra/config/configs";
import { CheckUsageLimitUseCase } from "../subscription/check-usage-limit.usecase";
import { ConfirmAppointmentUseCase } from "../appointment/confirm-appointment.usecase";
import { CancelAppointmentUseCase } from "../appointment/cancel-appointment.usecase";
import { isWithinSilentWindow } from "../../shared/utils/time.util";
import { CompanyConfig } from "../../infra/database/entities/company-config.entity";
import { GeminiAdapter } from "../../infra/adapters/gemini.adapter";
import { ConversationService } from "../chatbot/conversation.service";
import { t, type Locale } from "../../shared/i18n";

export class HandleEvolutionWebhookUseCase {
    constructor(
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly confirmAppointment: ConfirmAppointmentUseCase,
        private readonly cancelAppointment: CancelAppointmentUseCase,
        private readonly evolutionService: IEvolutionService,
        private readonly checkUsageLimit: CheckUsageLimitUseCase,
        private readonly geminiAdapter: GeminiAdapter,
        private readonly conversationService: ConversationService,
        private readonly professionalRepository: IProfessionalRepository,
        private readonly companyRepository: ICompanyRepository
    ) {}

    async execute(payload: EvolutionWebhookPayload): Promise<void> {
        const instanceName = payload.instance;
        if (!instanceName) return;

        if (payload.event === "connection.update") {
            await this.handleConnectionUpdate(instanceName, payload.data);
            return;
        }

        if (payload.event !== "messages.upsert") return;

        const data = payload.data;
        if (!data.key || data.key.fromMe) return;

        const remoteJid = (data.key?.remoteJid || "") as string;
        const senderJid = (payload.sender || "") as string;

        const lid = remoteJid.includes("@lid") ? remoteJid : "";
        const senderNumber = (senderJid || remoteJid).split("@")[0] || "";
        const fullJid = lid || senderJid || remoteJid;

        if (!lid && !senderNumber) return;

        const messageText = data.message?.extendedTextMessage?.text || data.message?.conversation || "";
        const stanzaId = data.message?.extendedTextMessage?.contextInfo?.stanzaId;

        if (instanceName === env.evolution.systemBotInstance) {
            await this.handleSystemBotMessage(instanceName, senderNumber, fullJid, messageText, stanzaId, payload);
            return;
        }

        await this.handleUserInstanceMessage(instanceName, senderNumber, fullJid, messageText);
    }

    private async handleConnectionUpdate(instanceName: string, data: { state?: string | undefined; worker?: string | undefined; jid?: string | undefined; number?: string | undefined }): Promise<void> {
        const state = data.state;
        if (state !== "open") return;

        const jid = (data.worker || data.jid) as string;
        const rawNumber = data.number as string;

        if (!jid) return;

        const config = await this.companyConfigRepository.findByInstanceName(instanceName);
        if (config) {
            const updateData: Partial<CompanyConfig> = { whatsappLid: jid };

            // Try to extract the phone number from multiple sources
            if (rawNumber && !rawNumber.includes("@")) {
                updateData.whatsappNumber = this.normalizeNumber(rawNumber);
            } else if (jid && jid.includes("@")) {
                // Extract number from jid format: "5511999999999@s.whatsapp.net"
                const numberFromJid = jid.split("@")[0];
                if (numberFromJid && /^\d+$/.test(numberFromJid)) {
                    updateData.whatsappNumber = this.normalizeNumber(numberFromJid);
                }
            }

            await this.companyConfigRepository.updateByCompanyId(config.companyId, updateData);
        }
    }

    private async handleUserInstanceMessage(instanceName: string, senderNumber: string, fullJid: string, text: string): Promise<void> {
        const config = await this.companyConfigRepository.findByInstanceName(instanceName);
        if (!config) return;

        const usage = await this.checkUsageLimit.execute(config.companyId);
        if (!usage.canSend) return;

        const isDirectResponse = this.isConfirmation(text) || this.isCancellation(text);

        if (!isDirectResponse && isWithinSilentWindow(config.silentWindowStart ?? "23:59", config.silentWindowEnd ?? "08:00")) {
            return;
        }

        // Handle appointment confirmation/cancellation via keyword
        const locale = (config.locale ?? "pt") as Locale;

        if (this.isConfirmation(text)) {
            try {
                await this.confirmAppointment.execute(config.companyId, senderNumber);
                await this.evolutionService.sendText(instanceName, fullJid, t(locale, "whatsapp.confirmSuccess"));
                return;
            } catch {
                // No pending appointment — fall through to AI
            }
        } else if (this.isCancellation(text)) {
            try {
                await this.cancelAppointment.execute(config.companyId, senderNumber);
                await this.evolutionService.sendText(instanceName, fullJid, t(locale, "whatsapp.cancelSuccess"));
                return;
            } catch {
                // No pending appointment — fall through to AI
            }
        }

        // AI-powered response (only for PRO users with bot enabled)
        if (usage.plan === "PRO" && config.botEnabled && env.gemini.apiKey) {
            try {
                await this.handleAIResponse(config, instanceName, senderNumber, fullJid, text);
            } catch (error) {
                console.error("[HandleWebhook] AI response failed, skipping:", error);
            }
        }
    }

    private async handleAIResponse(
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

    private async handleSystemBotMessage(
        instanceName: string,
        phoneNumber: string,
        fullJid: string,
        text: string,
        stanzaId?: string,
        payload?: EvolutionWebhookPayload
    ): Promise<void> {
        const uuidRegex = /([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/;

        const quotedText = (payload?.data?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
                          payload?.data?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || "") as string;
        const fullSearchText = `${text} ${quotedText}`;
        const match = fullSearchText.match(uuidRegex);

        if (!this.isConfirmation(text) && !match) return;

        let config: CompanyConfig | null = null;

        if (match && match[1]) {
            const configId = match[1];
            config = await this.companyConfigRepository.findByCompanyId(configId);

            if (config && (!config.whatsappLid || config.whatsappLid !== fullJid)) {
                await this.companyConfigRepository.updateByCompanyId(config.companyId, { whatsappLid: fullJid });
            }
        }

        if (!config && stanzaId) {
            config = await this.companyConfigRepository.findByLastMessageId(stanzaId);
            if (config && (!config.whatsappLid || config.whatsappLid !== fullJid)) {
                await this.companyConfigRepository.updateByCompanyId(config.companyId, { whatsappLid: fullJid });
            }
        }

        if (!config) {
            config = await this.companyConfigRepository.findByWhatsappNumber(fullJid);
            if (!config) {
                config = await this.companyConfigRepository.findByWhatsappNumber(phoneNumber);
            }

            if (config) {
                await this.companyConfigRepository.updateByCompanyId(config.companyId, { whatsappLid: fullJid });
            }
        }

        if (config) {
            const target = config.whatsappNumber?.startsWith("55") ? config.whatsappNumber : `55${config.whatsappNumber}`;
            await this.evolutionService.sendText(instanceName, target || phoneNumber, t("pt", "whatsapp.activationSuccess"));
        } else if (match) {
            await this.evolutionService.sendText(instanceName, phoneNumber, t("pt", "whatsapp.activationInvalid"));
        }
    }

    private isConfirmation(text: string): boolean {
        const keywords = [
            // Portuguese
            "sim", "confirmado", "ok", "com certeza", "pode confirmar", "confirmar", "perfeito", "topo",
            // English
            "yes", "confirmed", "confirm", "sure", "absolutely", "of course", "perfect"
        ];
        const normalized = text.toLowerCase().trim();
        return keywords.some(k => normalized.includes(k));
    }

    private isCancellation(text: string): boolean {
        const keywords = [
            // Portuguese
            "não", "nao", "cancelar", "desistir", "remarcar", "não vou", "nao vou", "cancela",
            // English
            "no", "cancel", "reschedule", "won't go", "can't make it", "not going"
        ];
        const normalized = text.toLowerCase().trim();
        return keywords.some(k => normalized.includes(k));
    }

    private normalizeNumber(number: string): string {
        return number.replace(/\D/g, "").replace(/^55/, "");
    }
}
