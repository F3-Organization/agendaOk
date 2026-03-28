import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { ConfirmAppointmentUseCase } from "../calendar/confirm-appointment.usecase";
import { CancelAppointmentUseCase } from "../calendar/cancel-appointment.usecase";

export class HandleEvolutionWebhookUseCase {
    constructor(
        private readonly userConfigRepository: IUserConfigRepository,
        private readonly confirmAppointment: ConfirmAppointmentUseCase,
        private readonly cancelAppointment: CancelAppointmentUseCase
    ) {}

    async execute(payload: any): Promise<void> {
        if (payload.event !== "messages.upsert") return;
        
        const data = payload.data;
        if (data.key.fromMe) return;

        const instanceName = payload.instance;
        const config = await this.userConfigRepository.findByInstanceName(instanceName);
        if (!config) return;

        const remoteJid = data.key.remoteJid;
        const phoneNumber = remoteJid.split("@")[0];
        const messageText = data.message?.conversation || data.message?.extendedTextMessage?.text || "";

        if (this.isConfirmation(messageText)) {
            await this.confirmAppointment.execute(config.userId, phoneNumber);
        } else if (this.isCancellation(messageText)) {
            await this.cancelAppointment.execute(config.userId, phoneNumber);
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
