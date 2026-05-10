import { IEvolutionService } from "../ports/ievolution-service";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";

/**
 * Use case to check the connection status of the user's WhatsApp instance.
 */
export class GetWhatsappStatusUseCase {
    constructor(
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly evolutionService: IEvolutionService
    ) {}

    async execute(companyId: string): Promise<{ status: string; instanceName: string | null }> {
        const config = await this.companyConfigRepository.findByCompanyId(companyId);
        
        if (!config || !config.whatsappInstanceName) {
            return { status: "DISCONNECTED", instanceName: null };
        }

        try {
            const response = await this.evolutionService.fetchInstance(config.whatsappInstanceName);
            const status = response.instance.status.toUpperCase(); // open, connecting, etc.
            
            return { 
                status: status === "OPEN" ? "CONNECTED" : status, 
                instanceName: config.whatsappInstanceName 
            };
        } catch (error) {
            return { status: "DISCONNECTED", instanceName: config.whatsappInstanceName };
        }
    }
}
