import { z } from "zod";

export const SubscriptionPaymentStatusSchema = z.enum(["PENDING", "PAID", "CANCELLED", "REFUNDED"]);

export const SubscriptionPaymentSchema = z.object({
    id: z.uuid(),
    status: SubscriptionPaymentStatusSchema,
    amount: z.number(),
    paidAt: z.iso.datetime().nullable().optional(),
    createdAt: z.iso.datetime(),
    checkoutUrl: z.url()
});

export type SubscriptionPayment = z.infer<typeof SubscriptionPaymentSchema>;

export const SubscriptionStatusSchema = z.object({
    status: z.enum(["ACTIVE", "CANCELLED", "PAST_DUE", "TRIAL", "INACTIVE"]),
    plan: z.string(),
    currentPeriodEnd: z.iso.datetime().nullable().optional(),
    checkoutUrl: z.url().nullable().optional()
});

export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
