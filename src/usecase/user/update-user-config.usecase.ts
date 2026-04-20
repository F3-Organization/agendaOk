import { env } from "../../infra/config/configs";
import { IEvolutionService } from "../ports/ievolution-service";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { IUserRepository } from "../repositories/iuser-repository";
import { AppError } from "../../shared/errors/app-error";
import { UpdateUserConfigDTO } from "../../../shared/schemas/user.schema";
import { CompanyConfig } from "../../infra/database/entities/company-config.entity";

export class UpdateUserConfigUseCase {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly companyConfigRepo: ICompanyConfigRepository,
        private readonly evolutionService: IEvolutionService
    ) {}

    async execute(userId: string, companyId: string, data: UpdateUserConfigDTO): Promise<void> {
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

        // 2. Prepare Config Data (saved per company)
        const configData: any = {};
        if (data.whatsappNumber !== undefined) {
             configData.whatsappNumber = data.whatsappNumber ? this.normalizeNumber(data.whatsappNumber) : null;
        }
        if (data.taxId !== undefined) configData.taxId = data.taxId;
        if (data.silentWindowStart !== undefined) configData.silentWindowStart = data.silentWindowStart;
        if (data.silentWindowEnd !== undefined) configData.silentWindowEnd = data.silentWindowEnd;
        if (data.syncEnabled !== undefined) configData.syncEnabled = data.syncEnabled;

        // 3. Update or Create CompanyConfig
        let config = await this.companyConfigRepo.findByCompanyId(companyId);
        const oldNumber = config?.whatsappNumber;
        const oldLid = config?.whatsappLid;
        
        if (!config) {
            const newConfig = new CompanyConfig();
            newConfig.companyId = companyId;
            Object.assign(newConfig, configData);
            config = await this.companyConfigRepo.save(newConfig);
        } else {
            if (Object.keys(configData).length > 0) {
                await this.companyConfigRepo.updateByCompanyId(companyId, configData);
                // Refresh config after update
                config = await this.companyConfigRepo.findByCompanyId(companyId);
            }
        }

        if (!config) return;

        // 4. WhatsApp Activation (if number changed or not verified)
        const normalizedNewNumber = data.whatsappNumber ? this.normalizeNumber(data.whatsappNumber) : null;
        const isNumberChanging = !!normalizedNewNumber && normalizedNewNumber !== oldNumber;
        const isNotVerified = !oldLid;

        if (data.whatsappNumber && (isNumberChanging || isNotVerified)) {
            try {
                const introMessage = `🔔 *Ativação ConfirmaZap*\n\n` +
                    `Olá! Para concluir seu vínculo com o sistema e receber alertas de agendamentos e cancelamentos por aqui, precisamos validar sua conta.\n\n` +
                    `👉 *Copie e envie a próxima mensagem abaixo neste chat:*`;

                const codeMessage = `Ref: ${config.id}`;
                const targetNumber = `55${normalizedNewNumber || config.whatsappNumber}`;

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
