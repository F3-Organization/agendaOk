import { ICompanyConfigRepository } from "../../repositories/icompany-config-repository";
import { CompanyConfig } from "../../../infra/database/entities/company-config.entity";
import { PhoneNormalizerService } from "../phone-normalizer.service";

export class ConnectionUpdateHandler {
    constructor(
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly phoneNormalizer: PhoneNormalizerService
    ) {}

    async handle(
        instanceName: string,
        data: { state?: string; worker?: string; jid?: string; number?: string }
    ): Promise<void> {
        const state = data.state;
        if (state !== "open") return;

        const jid = (data.worker || data.jid) as string;
        const rawNumber = data.number as string;

        if (!jid) return;

        const config = await this.companyConfigRepository.findByInstanceName(instanceName);
        if (!config) return;

        const updateData: Partial<CompanyConfig> = { whatsappLid: jid };

        if (rawNumber && !rawNumber.includes("@")) {
            updateData.whatsappNumber = this.phoneNormalizer.normalize(rawNumber);
        } else {
            const extracted = this.phoneNormalizer.extractFromJid(jid);
            if (extracted) {
                updateData.whatsappNumber = extracted;
            }
        }

        await this.companyConfigRepository.updateByCompanyId(config.companyId, updateData);
    }
}
