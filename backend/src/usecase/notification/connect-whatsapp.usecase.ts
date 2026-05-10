import { IEvolutionService, EvolutionConnectResponse } from "../ports/ievolution-service";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { env } from "../../infra/config/configs";
import { encrypt } from "../../shared/utils/cryptography";

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
            // Instance may already exist, continue
        }

        // Always fetch the token from the Evolution API (works for new and existing instances)
        const instanceToken = await this.evolutionService.fetchInstanceToken(instanceName);

        const webhookUrl = env.evolution.webhookUrl;
        await this.evolutionService.setWebhook(instanceName, webhookUrl);

        const updateData: Partial<Record<string, string>> = {
            whatsappInstanceName: instanceName
        };
        if (instanceToken) {
            updateData.whatsappInstanceToken = encrypt(instanceToken);
        }

        await this.companyConfigRepository.updateByCompanyId(companyId, updateData);

        return await this.evolutionService.connectInstance(instanceName);
    }
}
