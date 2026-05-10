import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { DashboardStats } from "../../../../shared/schemas/dashboard.schema";

export class GetDashboardStatsUseCase {
    constructor(
        private readonly companyConfigRepo: ICompanyConfigRepository
    ) {}

    public async execute(companyId: string): Promise<DashboardStats> {
        const config = await this.companyConfigRepo.findByCompanyId(companyId);

        return {
            totalConfirmations: 0,
            managedReplies: 0,
            conversionRate: "0%",
            confirmationsChange: "+0%",
            repliesChange: "+0%",
            conversionRateChange: "+0%",
            whatsappNumberMissing: !config || !config.whatsappNumber
        };
    }
}
