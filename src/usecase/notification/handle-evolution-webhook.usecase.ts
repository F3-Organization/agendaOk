import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { ConfirmAppointmentUseCase } from "../calendar/confirm-appointment.usecase";

export class HandleEvolutionWebhookUseCase {
    constructor(
        private readonly userConfigRepository: IUserConfigRepository,
        private readonly confirmAppointment: ConfirmAppointmentUseCase
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
        }
    }

    private isConfirmation(text: string): boolean {
        const keywords = ["sim", "confirmado", "ok", "com certeza", "pode confirmar", "confirmar"];
        const normalized = text.toLowerCase().trim();
        return keywords.some(k => normalized.includes(k));
    }
}
