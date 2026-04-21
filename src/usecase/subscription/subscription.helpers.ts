import { Subscription, SubscriptionStatus } from "../../infra/database/entities/subscription.entity";

export function isSubscriptionActive(subscription: Subscription | null | undefined): boolean {
    if (!subscription) return false;

    if (subscription.status === SubscriptionStatus.ACTIVE) return true;

    if (subscription.status === SubscriptionStatus.TRIAL) {
        if (!subscription.currentPeriodEnd) return false;
        return new Date(subscription.currentPeriodEnd) > new Date();
    }

    return false;
}

export function isProAccess(subscription: Subscription | null | undefined): boolean {
    return isSubscriptionActive(subscription) && subscription?.plan === "PRO";
}
