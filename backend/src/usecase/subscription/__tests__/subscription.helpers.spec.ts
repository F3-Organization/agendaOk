import { describe, it, expect } from "vitest";
import { isSubscriptionActive, isProAccess } from "../subscription.helpers";
import { SubscriptionStatus } from "../../../infra/database/entities/subscription.entity";
import { Subscription } from "../../../infra/database/entities/subscription.entity";

function buildSubscription(overrides: Partial<Subscription>): Subscription {
    return {
        id: "sub-1",
        userId: "user-1",
        plan: "PRO",
        status: SubscriptionStatus.ACTIVE,
        ...overrides
    } as Subscription;
}

describe("isSubscriptionActive", () => {
    it("retorna true para ACTIVE", () => {
        const sub = buildSubscription({ status: SubscriptionStatus.ACTIVE });
        expect(isSubscriptionActive(sub)).toBe(true);
    });

    it("retorna true para TRIAL com periodo valido", () => {
        const future = new Date();
        future.setDate(future.getDate() + 5);
        const sub = buildSubscription({ status: SubscriptionStatus.TRIAL, currentPeriodEnd: future });
        expect(isSubscriptionActive(sub)).toBe(true);
    });

    it("retorna false para TRIAL expirado", () => {
        const past = new Date();
        past.setDate(past.getDate() - 1);
        const sub = buildSubscription({ status: SubscriptionStatus.TRIAL, currentPeriodEnd: past });
        expect(isSubscriptionActive(sub)).toBe(false);
    });

    it("retorna false para TRIAL sem currentPeriodEnd", () => {
        const sub = buildSubscription({ status: SubscriptionStatus.TRIAL, currentPeriodEnd: undefined });
        expect(isSubscriptionActive(sub)).toBe(false);
    });

    it("retorna false para INACTIVE", () => {
        const sub = buildSubscription({ status: SubscriptionStatus.INACTIVE });
        expect(isSubscriptionActive(sub)).toBe(false);
    });

    it("retorna false para CANCELLED", () => {
        const sub = buildSubscription({ status: SubscriptionStatus.CANCELLED });
        expect(isSubscriptionActive(sub)).toBe(false);
    });

    it("retorna false para null/undefined", () => {
        expect(isSubscriptionActive(null)).toBe(false);
        expect(isSubscriptionActive(undefined)).toBe(false);
    });
});

describe("isProAccess", () => {
    it("retorna true para ACTIVE + PRO", () => {
        const sub = buildSubscription({ status: SubscriptionStatus.ACTIVE, plan: "PRO" });
        expect(isProAccess(sub)).toBe(true);
    });

    it("retorna true para TRIAL valido + PRO", () => {
        const future = new Date();
        future.setDate(future.getDate() + 3);
        const sub = buildSubscription({ status: SubscriptionStatus.TRIAL, plan: "PRO", currentPeriodEnd: future });
        expect(isProAccess(sub)).toBe(true);
    });

    it("retorna false para ACTIVE + FREE", () => {
        const sub = buildSubscription({ status: SubscriptionStatus.ACTIVE, plan: "FREE" });
        expect(isProAccess(sub)).toBe(false);
    });

    it("retorna false para TRIAL expirado + PRO", () => {
        const past = new Date();
        past.setDate(past.getDate() - 1);
        const sub = buildSubscription({ status: SubscriptionStatus.TRIAL, plan: "PRO", currentPeriodEnd: past });
        expect(isProAccess(sub)).toBe(false);
    });

    it("retorna false para null", () => {
        expect(isProAccess(null)).toBe(false);
    });
});
