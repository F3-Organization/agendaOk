import { ICompanyConfigRepository } from "../../repositories/icompany-config-repository";
import { IEvolutionService } from "../../ports/ievolution-service";
import { CheckUsageLimitUseCase } from "../../subscription/check-usage-limit.usecase";
import { ConfirmAppointmentUseCase } from "../../appointment/confirm-appointment.usecase";
import { CancelAppointmentUseCase } from "../../appointment/cancel-appointment.usecase";
import { KeywordDetectorService } from "../keyword-detector.service";
import { SilentWindowService } from "../silent-window.service";
import { AIResponseHandler } from "./ai-response.handler";
import { env } from "../../../infra/config/configs";
import { t, type Locale } from "../../../shared/i18n";
import type { MessageContext } from "../message-parser.service";

export class UserMessageHandler {
    constructor(
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly evolutionService: IEvolutionService,
        private readonly checkUsageLimit: CheckUsageLimitUseCase,
        private readonly confirmAppointment: ConfirmAppointmentUseCase,
        private readonly cancelAppointment: CancelAppointmentUseCase,
        private readonly keywordDetector: KeywordDetectorService,
        private readonly silentWindow: SilentWindowService,
        private readonly aiResponseHandler: AIResponseHandler
    ) {}

    async handle(
        instanceName: string,
        senderNumber: string,
        fullJid: string,
        text: string,
        mediaType: MessageContext["mediaType"] = "text"
    ): Promise<void> {
        const config = await this.companyConfigRepository.findByInstanceName(instanceName);
        if (!config) return;

        const usage = await this.checkUsageLimit.execute(config.companyId);
        if (!usage.canSend) return;

        const locale = (config.locale ?? "pt") as Locale;

        // Handle non-text media (audio, video, sticker, etc.)
        // Images/videos with captions already have text extracted, so only block if no text
        if (mediaType !== "text" && !text.trim()) {
            if (usage.plan === "PRO" && config.botEnabled) {
                await this.evolutionService.sendText(instanceName, fullJid, t(locale, "bot.textOnly"));
            }
            return;
        }

        // Direct responses (confirm/cancel) bypass silent window
        const isDirectResponse = this.keywordDetector.isDirectResponse(text);

        if (!isDirectResponse && this.silentWindow.isSilent(config)) {
            return;
        }

        // Handle appointment confirmation
        if (this.keywordDetector.isConfirmation(text)) {
            try {
                await this.confirmAppointment.execute(config.companyId, senderNumber);
                await this.evolutionService.sendText(instanceName, fullJid, t(locale, "whatsapp.confirmSuccess"));
                return;
            } catch {
                // No pending appointment — fall through to AI
            }
        }

        // Handle appointment cancellation
        if (this.keywordDetector.isCancellation(text)) {
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
                await this.aiResponseHandler.handle(config, instanceName, senderNumber, fullJid, text);
            } catch (error) {
                console.error("[UserMessageHandler] AI response failed, skipping:", error);
            }
        }
    }
}
