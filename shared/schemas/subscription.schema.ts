import { z } from "zod";

export const SubscriptionPaymentStatusSchema = z.enum(["PENDING", "PAID", "CANCELLED", "REFUNDED"]);

export const SubscriptionPaymentSchema = z.object({
    id: z.string().uuid(),
    status: SubscriptionPaymentStatusSchema,
    amount: z.number(),
    paidAt: z.string().datetime().nullable().optional(),
    createdAt: z.string().datetime(),
    checkoutUrl: z.string().url()
});

export type SubscriptionPayment = z.infer<typeof SubscriptionPaymentSchema>;

export const SubscriptionStatusSchema = z.object({
    status: z.enum(["ACTIVE", "CANCELLED", "PAST_DUE", "TRIAL", "INACTIVE"]),
    plan: z.string(),
    currentPeriodEnd: z.string().datetime().nullable().optional(),
    checkoutUrl: z.string().url().nullable().optional()
});

export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
