import { IScheduleRepository } from "../repositories/ischedule-repository";
import { IUserConfigRepository } from "../repositories/iuser-config-repository";
import { ScheduleStatus, Schedule } from "../../infra/database/entities/schedule.entity";
import { DashboardStats } from "../../../shared/schemas/dashboard.schema";

export class GetDashboardStatsUseCase {
    constructor(
        private readonly scheduleRepo: IScheduleRepository,
        private readonly userConfigRepo: IUserConfigRepository
    ) {}

    public async execute(userId: string): Promise<DashboardStats> {
        const config = await this.userConfigRepo.findByUserId(userId);
        const calendarConnected = !!(config && config.googleRefreshToken);
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const allSchedules = await this.scheduleRepo.findByUserId(userId);

        // Current Period (CP) - Last 7 days
        const cpSchedules = allSchedules.filter(s => s.createdAt >= sevenDaysAgo);
        
        // Previous Period (PP) - 7 to 14 days ago
        const ppSchedules = allSchedules.filter(s => s.createdAt >= fourteenDaysAgo && s.createdAt < sevenDaysAgo);

        // 1. Total Confirmations (All time or last 7 days? Mock used all-time/total-length)
        // I'll use all time counts but calculate change based on last 7 days.
        const totalConfirmations = allSchedules.filter(s => s.isNotified).length;
        const cpConfirmations = cpSchedules.filter(s => s.isNotified).length;
        const ppConfirmations = ppSchedules.filter(s => s.isNotified).length;

        // 2. Managed Replies
        const managedReplies = allSchedules.filter(s => 
            s.status === ScheduleStatus.CONFIRMED || 
            s.status === ScheduleStatus.CANCELLED
        ).length;
        const cpReplies = cpSchedules.filter(s => 
            s.status === ScheduleStatus.CONFIRMED || 
            s.status === ScheduleStatus.CANCELLED
        ).length;
        const ppReplies = ppSchedules.filter(s => 
            s.status === ScheduleStatus.CONFIRMED || 
            s.status === ScheduleStatus.CANCELLED
        ).length;

        const calculateChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? "+100%" : "0%";
            const diff = ((current - previous) / previous) * 100;
            const sign = diff >= 0 ? "+" : "";
            return `${sign}${diff.toFixed(1)}%`;
        };

        const getRate = (confirmed: number, notified: number) => {
            if (notified === 0) return 0;
            return (confirmed / notified) * 100;
        };

        const cpRate = getRate(cpConfirmations, cpConfirmations); // Since totalConfirmations is based on isNotified
        // Wait, cpConfirmations in my code is "totalConfirmations = allSchedules.filter(s => s.isNotified).length"

        // Let's refine the variables for clarity:
        const currentNotified = cpSchedules.filter(s => s.isNotified).length;
        const currentConfirmed = cpSchedules.filter(s => s.status === ScheduleStatus.CONFIRMED).length;
        
        const previousNotified = ppSchedules.filter(s => s.isNotified).length;
        const previousConfirmed = ppSchedules.filter(s => s.status === ScheduleStatus.CONFIRMED).length;

        const currentRateValue = getRate(currentConfirmed, currentNotified);
        const previousRateValue = getRate(previousConfirmed, previousNotified);

        return {
            totalConfirmations: allSchedules.filter(s => s.isNotified).length,
            managedReplies,
            conversionRate: `${currentRateValue.toFixed(1)}%`,
            confirmationsChange: calculateChange(cpConfirmations, ppConfirmations),
            repliesChange: calculateChange(cpReplies, ppReplies),
            conversionRateChange: calculateChange(currentRateValue, previousRateValue),
            calendarConnected
        };

    }
}
