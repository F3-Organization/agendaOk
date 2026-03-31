import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { IEvolutionService } from "../ports/ievolution-service";
import { ConfirmAppointmentUseCase } from "../calendar/confirm-appointment.usecase";
import { CancelAppointmentUseCase } from "../calendar/cancel-appointment.usecase";
import { AcceptInviteUseCase } from "../calendar/accept-invite.usecase";
import { EvolutionWebhookPayload } from "../../../shared/schemas/evolution.schema";
import { env } from "../../infra/config/configs";
import { CheckUsageLimitUseCase } from "../subscription/check-usage-limit.usecase";
import { isWithinSilentWindow } from "../../shared/utils/time.util";

export class HandleEvolutionWebhookUseCase {
    constructor(
        private readonly userConfigRepository: IUserConfigRepository,
        private readonly scheduleRepository: IScheduleRepository,
        private readonly confirmAppointment: ConfirmAppointmentUseCase,
        private readonly cancelAppointment: CancelAppointmentUseCase,
        private readonly acceptInvite: AcceptInviteUseCase,
        private readonly evolutionService: IEvolutionService,
        private readonly checkUsageLimit: CheckUsageLimitUseCase
    ) {}

    async execute(payload: EvolutionWebhookPayload): Promise<void> {
        if (payload.event !== "messages.upsert") return;
        
        const data = payload.data;
        if (!data.key || data.key.fromMe) return;

        const instanceName = payload.instance;
        if (!instanceName) return;

        // Prioritize 'sender' field from Evolution API v2 (handles @lid virtual IDs)
        const fullJid = payload.sender || data.key?.remoteJid;
        if (!fullJid) return;
        
        const phoneNumber = (fullJid as string).split("@")[0] || "";
        if (!phoneNumber) return;

        const messageText = data.message?.conversation || data.message?.extendedTextMessage?.text || "";
        
        console.log(`[HandleWebhook] Received message from ${phoneNumber}: "${messageText}" on instance ${instanceName}`);

        // 1. Handle System Bot (Direct message to/from user)
        if (instanceName === env.evolution.systemBotInstance) {
            await this.handleSystemBotMessage(phoneNumber, messageText);
            return;
        }

        // 2. Handle User Instance (Agent for client confirmation)
        const config = await this.userConfigRepository.findByInstanceName(instanceName);
        if (!config) return;

        const usage = await this.checkUsageLimit.execute(config.userId);
        if (!usage.canSend) {
            console.log(`[HandleWebhook] User ${config.userId} quota reached. Skipping auto-reply.`);
            return;
        }

        // 3. Check Silent Window (only if not confirming via SIM/NAO)
        const isConfirmation = this.isConfirmation(messageText) || this.isCancellation(messageText);
        if (!isConfirmation && isWithinSilentWindow(config.silentWindowStart, config.silentWindowEnd)) {
            console.log(`[HandleWebhook] Skipping message due to silent window for user ${config.userId}`);
            return;
        }

        if (this.isConfirmation(messageText)) {
            try {
                await this.confirmAppointment.execute(config.userId, phoneNumber);
                await this.evolutionService.sendText(instanceName, phoneNumber, "✅ Ótimo! Seu agendamento foi confirmado com sucesso. Te esperamos!");
            } catch (error) {
                // Silently log
            }
        } else if (this.isCancellation(messageText)) {
            try {
                await this.cancelAppointment.execute(config.userId, phoneNumber);
                await this.evolutionService.sendText(instanceName, phoneNumber, "❌ Certo, seu agendamento foi cancelado. Entre em contato para remarcar quando puder.");
            } catch (error) {
                // Silently log
            }
        }
    }

    private async handleSystemBotMessage(phoneNumber: string, text: string): Promise<void> {
        if (!this.isConfirmation(text)) return;
        
        const normalizedNumber = this.normalizeNumber(phoneNumber);
        const config = await this.userConfigRepository.findByWhatsappNumber(normalizedNumber);
        if (!config) {
            console.log(`[HandleWebhook] User config not found for normalized number: ${normalizedNumber}`);
            return;
        }

        const usage = await this.checkUsageLimit.execute(config.userId);
        if (!usage.canSend) return;

        const lastInvite = await this.scheduleRepository.findLastPendingInvite(config.userId);
        if (!lastInvite) {
            await this.evolutionService.sendText(env.evolution.systemBotInstance, phoneNumber, "⚠️ Não encontrei nenhum convite pendente para aceitar no momento.");
            return;
        }

        try {
            await this.acceptInvite.execute(config.userId, lastInvite.id);
            await this.evolutionService.sendText(env.evolution.systemBotInstance, phoneNumber, `✅ Perfeito! O compromisso *"${lastInvite.title}"* foi aceito e confirmado no seu Google Calendar.`);
        } catch (error: any) {
            console.error(`[HandleSystemBot] Error accepting invite for user ${config.userId}:`, error);
            await this.evolutionService.sendText(env.evolution.systemBotInstance, phoneNumber, "❌ Ops, tive um problema ao tentar aceitar seu convite no Google Calendar. Tente novamente em instantes.");
        }
    }

    private isConfirmation(text: string): boolean {
        const keywords = ["sim", "confirmado", "ok", "com certeza", "pode confirmar", "confirmar", "perfeito", "topo"];
        const normalized = text.toLowerCase().trim();
        return keywords.some(k => normalized.includes(k));
    }

    private isCancellation(text: string): boolean {
        const keywords = ["não", "nao", "cancelar", "desistir", "remarcar", "não vou", "nao vou", "cancela"];
        const normalized = text.toLowerCase().trim();
        return keywords.some(k => normalized.includes(k));
    }

    private normalizeNumber(number: string): string {
        return number.replace(/\D/g, "").replace(/^55/, "");
    }
}
