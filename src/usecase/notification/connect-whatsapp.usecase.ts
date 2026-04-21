import { IEvolutionService, EvolutionConnectResponse } from "../ports/ievolution-service";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { env } from "../../infra/config/configs";

export class ConnectWhatsappUseCase {
    constructor(
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly evolutionService: IEvolutionService
    ) { }

    async execute(companyId: string): Promise<EvolutionConnectResponse> {
        const config = await this.companyConfigRepository.findByCompanyId(companyId);
        if (!config) {
            throw new Error("User configuration not found");
        }

        const instanceName = `agent_${companyId.replace(/-/g, "").substring(0, 10)}`;

        try {
            await this.evolutionService.createInstance(instanceName);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
        }

        const webhookUrl = env.evolution.webhookUrl;

        await this.evolutionService.setWebhook(instanceName, webhookUrl);

        await this.companyConfigRepository.updateByCompanyId(companyId, {
            whatsappInstanceName: instanceName
        });

        return await this.evolutionService.connectInstance(instanceName);
    }
}
