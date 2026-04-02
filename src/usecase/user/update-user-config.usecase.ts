import { env } from "../../infra/config/configs";
import { IEvolutionService } from "../ports/ievolution-service";
import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { IUserRepository } from "../repositories/iuser-repository";
import { AppError } from "../../shared/errors/app-error";
import { UpdateUserConfigDTO } from "../../../shared/schemas/user.schema";

export class UpdateUserConfigUseCase {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly userConfigRepo: IUserConfigRepository,
        private readonly evolutionService: IEvolutionService
    ) {}

    async execute(userId: string, data: UpdateUserConfigDTO): Promise<void> {
        if (!userId) {
            throw new AppError("ID do usuário é obrigatório", 400);
        }

        // 1. Update User Profile (Name/Email) if provided
        if (data.name || data.email) {
            await this.userRepo.update(userId, {
                ...(data.name && { name: data.name }),
                ...(data.email && { email: data.email }),
            });
        }

        // 2. Prepare Config Data
        const configData: any = {};
        if (data.whatsappNumber !== undefined) {
             configData.whatsappNumber = data.whatsappNumber ? this.normalizeNumber(data.whatsappNumber) : null;
        }
        if (data.taxId !== undefined) configData.taxId = data.taxId;
        if (data.silentWindowStart !== undefined) configData.silentWindowStart = data.silentWindowStart;
        if (data.silentWindowEnd !== undefined) configData.silentWindowEnd = data.silentWindowEnd;
        if (data.syncEnabled !== undefined) configData.syncEnabled = data.syncEnabled;

        // 3. Update or Create Config
        let config = await this.userConfigRepo.findByUserId(userId);
        
        if (!config) {
            config = await this.userConfigRepo.save({
                userId,
                ...configData
            });
        } else {
            if (Object.keys(configData).length > 0) {
                await this.userConfigRepo.update(userId, configData);
            }
        }

        // 4. WhatsApp Activation (if number changed)
        if (data.whatsappNumber && config) {
            try {
                const introMessage = `🔔 *Ativação ConfirmaZap*\n\n` +
                    `Olá! Para concluir seu vínculo com o sistema e receber alertas de agendamentos e cancelamentos por aqui, precisamos validar sua conta.\n\n` +
                    `👉 *Copie e envie a próxima mensagem abaixo neste chat:*`;

                const codeMessage = `Ref: ${config.id}`;
                const targetNumber = `55${configData.whatsappNumber || config.whatsappNumber}`;

                await this.evolutionService.sendText(
                    env.evolution.systemBotInstance, 
                    targetNumber, 
                    introMessage
                );

                await this.evolutionService.sendText(
                    env.evolution.systemBotInstance, 
                    targetNumber, 
                    codeMessage
                );
            } catch (error: unknown) {
                // Silently fail or log
            }
        }
    }

    private normalizeNumber(number: string): string {
        return number.replace(/\D/g, "").replace(/^55/, "");
    }
}
