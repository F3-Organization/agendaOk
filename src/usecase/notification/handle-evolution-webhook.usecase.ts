import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { IEvolutionService } from "../ports/ievolution-service";
import { ConfirmAppointmentUseCase } from "../calendar/confirm-appointment.usecase";
import { CancelAppointmentUseCase } from "../calendar/cancel-appointment.usecase";
import { EvolutionWebhookPayload } from "../../../shared/schemas/evolution.schema";

export class HandleEvolutionWebhookUseCase {
    constructor(
        private readonly userConfigRepository: IUserConfigRepository,
        private readonly confirmAppointment: ConfirmAppointmentUseCase,
        private readonly cancelAppointment: CancelAppointmentUseCase,
        private readonly evolutionService: IEvolutionService
    ) {}

    async execute(payload: EvolutionWebhookPayload): Promise<void> {
        if (payload.event !== "messages.upsert") return;
        
        const data = payload.data;
        if (!data.key || data.key.fromMe) return;

        const instanceName = payload.instance;
        const config = await this.userConfigRepository.findByInstanceName(instanceName);
        if (!config) return;

        const remoteJid = data.key.remoteJid;
        if (!remoteJid) return;

        const phoneNumber = remoteJid.split("@")[0];
        if (!phoneNumber) return;


        const messageText = data.message?.conversation || data.message?.extendedTextMessage?.text || "";

        if (this.isConfirmation(messageText)) {
            try {
                await this.confirmAppointment.execute(config.userId, phoneNumber);
                await this.evolutionService.sendText(instanceName, phoneNumber, "✅ Ótimo! Seu agendamento foi confirmado com sucesso. Te esperamos!");
            } catch (error) {
                // Silently log or handle via system logger if injected
            }
        } else if (this.isCancellation(messageText)) {
            try {
                await this.cancelAppointment.execute(config.userId, phoneNumber);
                await this.evolutionService.sendText(instanceName, phoneNumber, "❌ Certo, seu agendamento foi cancelado. Entre em contato para remarcar quando puder.");
            } catch (error) {
                // Silently log or handle via system logger if injected
            }
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
}
