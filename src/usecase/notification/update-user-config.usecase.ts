import { env } from "../../infra/config/configs";
import { IEvolutionService } from "../ports/ievolution-service";
import { IUserConfigRepository } from "../repositories/iuser-config-repository";

export interface UpdateUserConfigDTO {
    whatsappNumber?: string | undefined;
    syncEnabled?: boolean | undefined;
    silentWindowStart?: string | undefined;
    silentWindowEnd?: string | undefined;
}

export class UpdateUserConfigUseCase {
    constructor(
        private readonly userConfigRepo: IUserConfigRepository,
        private readonly evolutionService: IEvolutionService
    ) {}

    async execute(userId: string, data: UpdateUserConfigDTO): Promise<void> {
        let config = await this.userConfigRepo.findByUserId(userId);
        
        if (!config) {
            config = await this.userConfigRepo.save({
                userId,
                ...data
            } as any);
        } else {
            await this.userConfigRepo.update(userId, data as any);
        }

        // If the number was updated/added, send a test message to capture LID
        if (data.whatsappNumber) {
            try {
                const message = `🔔 *ConfirmaZap: Ativação de Notificações*\n\n` +
                    `Olá! Recebi seu número para envio de lembretes.\n` +
                    `Por favor, *responda esta mensagem com um OK* para que eu possa reconhecer seu WhatsApp e ativar o sistema.\n\n` +
                    `Obrigado!`;

                const messageId = await this.evolutionService.sendText(
                    env.evolution.systemBotInstance, 
                    data.whatsappNumber, 
                    message
                );

                if (messageId) {
                    await this.userConfigRepo.update(userId, { lastMessageId: messageId });
                    console.log(`[UpdateConfig] Greeting sent to ${data.whatsappNumber}. Mapping ID: ${messageId}`);
                }
            } catch (error) {
                console.error(`[UpdateConfig] Failed to send greeting to ${data.whatsappNumber}:`, error);
            }
        }
    }
}
