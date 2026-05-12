import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { IScheduleRepository } from "../repositories/ischedule-repository";
import { ScheduleStatus } from "../../infra/database/entities/schedule.entity";
import { DashboardStats } from "../../../../shared/schemas/dashboard.schema";

function monthRange(date: Date): { start: Date; end: Date } {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
}

function percentChange(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const delta = Math.round(((current - previous) / previous) * 100);
    return (delta >= 0 ? "+" : "") + delta + "%";
}

export class GetDashboardStatsUseCase {
    constructor(
        private readonly companyConfigRepo: ICompanyConfigRepository,
        private readonly scheduleRepo: IScheduleRepository
    ) {}

    public async execute(companyId: string): Promise<DashboardStats> {
        const config = await this.companyConfigRepo.findByCompanyId(companyId);

        const now = new Date();
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const curr = monthRange(now);
        const prev = monthRange(prevMonth);

        const [
            currConfirmed,
            currNotified,
            prevConfirmed,
            prevNotified,
        ] = await Promise.all([
            this.scheduleRepo.countByStatus(companyId, ScheduleStatus.CONFIRMED, curr.start, curr.end),
            this.scheduleRepo.countMonthlyNotifications(companyId, curr.start, curr.end),
            this.scheduleRepo.countByStatus(companyId, ScheduleStatus.CONFIRMED, prev.start, prev.end),
            this.scheduleRepo.countMonthlyNotifications(companyId, prev.start, prev.end),
        ]);

        const currRate = currNotified > 0 ? (currConfirmed / currNotified) * 100 : 0;
        const prevRate = prevNotified > 0 ? (prevConfirmed / prevNotified) * 100 : 0;

        return {
            totalConfirmations: currConfirmed,
            managedReplies: currNotified,
            conversionRate: Math.round(currRate) + "%",
            confirmationsChange: percentChange(currConfirmed, prevConfirmed),
            repliesChange: percentChange(currNotified, prevNotified),
            conversionRateChange: percentChange(Math.round(currRate), Math.round(prevRate)),
            whatsappNumberMissing: !config || !config.whatsappNumber,
        };
    }
}
