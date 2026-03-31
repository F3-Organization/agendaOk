import { z } from "zod";

export const DashboardStatsSchema = z.object({
    totalConfirmations: z.number(),
    managedReplies: z.number(),
    conversionRate: z.string(),
    confirmationsChange: z.string(),
    repliesChange: z.string(),
    conversionRateChange: z.string(),
    appointmentStats: z.array(z.object({
        status: z.string(),
        count: z.number()
    })),
    calendarConnected: z.boolean(),
    whatsappNumberMissing: z.boolean()
});




export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
