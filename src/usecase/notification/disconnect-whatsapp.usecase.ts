import { IEvolutionService } from "../ports/ievolution-service";
import { IUserConfigRepository } from "../repositories/iuser-config-repository";

export class DisconnectWhatsappUseCase {
    constructor(
        private readonly userConfigRepository: IUserConfigRepository,
        private readonly evolutionService: IEvolutionService
    ) {}

    async execute(userId: string): Promise<void> {
        const config = await this.userConfigRepository.findByUserId(userId);
        if (!config || !config.whatsappInstanceName) return;

        const instanceName = config.whatsappInstanceName;

        try {
            // 1. Tentar fazer logout e deletar na Evolution API
            // Ignoramos erros em chamadas de deleção/logout para garantir que o banco seja limpo
            await this.evolutionService.logoutInstance(instanceName).catch(() => {});
            await this.evolutionService.deleteInstance(instanceName).catch(() => {});
        } catch (error: any) {
            console.warn(`[DisconnectWhatsapp] Error during deletion of instance ${instanceName}:`, error.message);
        }

        // 2. Limpar o nome da instância no banco
        await this.userConfigRepository.update(userId, {
            whatsappInstanceName: null as any
        });
    }
}
