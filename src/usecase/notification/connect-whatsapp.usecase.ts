import { IEvolutionService } from "../ports/ievolution-service";
import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { env } from "../../infra/config/configs";

export class ConnectWhatsappUseCase {
    constructor(
        private readonly userConfigRepository: IUserConfigRepository,
        private readonly evolutionService: IEvolutionService
    ) {}

    async execute(userId: string): Promise<{ base64: string }> {
        const config = await this.userConfigRepository.findByUserId(userId);
        if (!config) throw new Error("User configuration not found");

        // Nome da instância baseado no ID do usuário
        const instanceName = `agent_${userId.replace(/-/g, "").substring(0, 10)}`;

        try {
            // 1. Tentar criar a instância
            await this.evolutionService.createInstance(instanceName);
        } catch (error: any) {
            // Se a instância já existe, apenas seguimos para configurar o webhook e pegar o QR
            console.log(`[ConnectWhatsapp] Instance ${instanceName} already exists or failed to create. Proceeding...`);
        }

        // 2. Configurar o Webhook para receber eventos
        const protocol = env.isProduction() ? "https" : "http";
        const host = env.domain;
        const port = env.isProduction() ? "" : `:${env.port}`;
        const webhookUrl = `${protocol}://${host}${port}/api/webhook/evolution`;
        
        await this.evolutionService.setWebhook(instanceName, webhookUrl);

        // 3. Salvar o nome da instância no config do usuário
        await this.userConfigRepository.update(userId, {
            whatsappInstanceName: instanceName
        });

        // 4. Retornar o QR Code para conexão
        return await this.evolutionService.connectInstance(instanceName);
    }
}
