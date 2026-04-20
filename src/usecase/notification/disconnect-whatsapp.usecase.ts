import { IEvolutionService } from "../ports/ievolution-service";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";

export class DisconnectWhatsappUseCase {
    constructor(
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly evolutionService: IEvolutionService
    ) {}

    async execute(companyId: string): Promise<void> {
        const config = await this.companyConfigRepository.findByCompanyId(companyId);
        
        if (!config || !config.whatsappInstanceName) {
            return;
        }

        const instanceName = config.whatsappInstanceName;

        try {
            await this.evolutionService.logoutInstance(instanceName).catch(() => {});
            await this.evolutionService.deleteInstance(instanceName).catch(() => {});
        } catch (error) {
        }

        await this.companyConfigRepository.updateByCompanyId(companyId, {
            whatsappInstanceName: null as unknown as string 
        });
    }
}
