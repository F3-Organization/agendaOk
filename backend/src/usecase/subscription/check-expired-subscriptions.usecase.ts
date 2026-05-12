import { ISubscriptionRepository } from "../repositories/isubscription-repository";
import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";
import { UserRepository } from "../../infra/database/repositories/user.repository";
import { SubscriptionNotificationService } from "./subscription-notification.service";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { ICompanyRepository } from "../repositories/icompany-repository";
import { IEvolutionService } from "../ports/ievolution-service";
import { env } from "../../infra/config/configs";

export class CheckExpiredSubscriptionsUseCase {
    constructor(
        private readonly subscriptionRepository: ISubscriptionRepository,
        private readonly userRepository: UserRepository,
        private readonly notificationService: SubscriptionNotificationService,
        private readonly companyConfigRepository: ICompanyConfigRepository,
        private readonly companyRepository: ICompanyRepository,
        private readonly evolutionService: IEvolutionService
    ) {}

    async execute(): Promise<{ reminders: number; pastDue: number; downgraded: number }> {
        const reminders = await this.sendRenewalReminders();
        const pastDue = await this.markExpiredAsPastDue();
        const downgraded = await this.downgradeGraceExpired();

        return { reminders, pastDue, downgraded };
    }

    /**
     * Step 1: Send renewal reminders for ACTIVE subscriptions expiring soon.
     * Sends email notification N days before expiry.
     */
    private async sendRenewalReminders(): Promise<number> {
        const reminderDays = env.abacatePay.renewalReminderDays;
        const expiringSoon = await this.subscriptionRepository.findExpiringSoon(reminderDays);

        for (const subscription of expiringSoon) {
            const user = await this.userRepository.findById(subscription.userId);
            if (!user) continue;

            const daysLeft = Math.max(
                1,
                Math.ceil((subscription.currentPeriodEnd!.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            );

            try {
                await this.notificationService.notifyRenewalReminder(user.email, user.name, daysLeft);
                console.log(`[SubscriptionCheck] Renewal reminder sent to ${user.email} (${daysLeft} days left)`);
            } catch (error: any) {
                console.error(`[SubscriptionCheck] Failed to send renewal reminder to ${user.email}:`, error.message);
            }
        }

        return expiringSoon.length;
    }

    /**
     * Step 2: Mark expired ACTIVE/TRIAL subscriptions as PAST_DUE.
     * This gives the user a grace period to pay before downgrade.
     */
    private async markExpiredAsPastDue(): Promise<number> {
        const expired = await this.subscriptionRepository.findExpired();

        for (const subscription of expired) {
            const newStatus = subscription.status === SubscriptionStatus.TRIAL
                ? SubscriptionStatus.CANCELLED
                : SubscriptionStatus.PAST_DUE;

            await this.subscriptionRepository.updateStatus(
                subscription.id,
                subscription.userId,
                newStatus
            );

            const user = await this.userRepository.findById(subscription.userId);
            if (user) {
                await this.notificationService.notifySubscriptionExpired(user.email, user.name);
                console.log(`[SubscriptionCheck] Marked ${subscription.id} as ${newStatus} for user ${user.email}`);
            }
        }

        return expired.length;
    }

    /**
     * Step 3: Downgrade PAST_DUE subscriptions to FREE after grace period.
     * - Changes plan to "FREE" and status to "INACTIVE"
     * - Disables the bot on ALL companies owned by the user
     * - Notifies via email
     * - Attempts notification via WhatsApp if connected
     */
    private async downgradeGraceExpired(): Promise<number> {
        const graceDays = env.abacatePay.pixGracePeriodDays;
        const pastDueExpired = await this.subscriptionRepository.findPastDueExpired(graceDays);

        for (const subscription of pastDueExpired) {
            // 1. Downgrade subscription to FREE + INACTIVE
            await this.subscriptionRepository.updateStatus(
                subscription.id,
                subscription.userId,
                SubscriptionStatus.INACTIVE,
                undefined,
                "FREE"
            );

            // 2. Disable bot on ALL companies owned by this user
            const companies = await this.companyRepository.findByOwnerId(subscription.userId);
            for (const company of companies) {
                try {
                    await this.companyConfigRepository.updateByCompanyId(company.id, {
                        botEnabled: false,
                    } as any);
                    console.log(`[SubscriptionCheck] Disabled bot for company ${company.id}`);
                } catch (error: any) {
                    console.error(`[SubscriptionCheck] Failed to disable bot for company ${company.id}:`, error.message);
                }
            }

            // 3. Notify via email
            const user = await this.userRepository.findById(subscription.userId);
            if (user) {
                try {
                    await this.notificationService.notifyDowngradedToFree(user.email, user.name);
                    console.log(`[SubscriptionCheck] Downgrade email sent to ${user.email}`);
                } catch (error: any) {
                    console.error(`[SubscriptionCheck] Failed to send downgrade email to ${user.email}:`, error.message);
                }

                // 4. Try to notify via WhatsApp (best effort — user's first company)
                if (companies.length > 0) {
                    const primaryCompany = companies[0]!;
                    const config = await this.companyConfigRepository.findByCompanyId(primaryCompany.id);
                    if (config?.whatsappInstanceName && config?.whatsappNumber) {
                        try {
                            const message =
                                `⚠️ *Aviso ConfirmaZap*\n\n` +
                                `Olá, ${user.name}! Seu plano foi rebaixado para FREE por falta de pagamento.\n\n` +
                                `O bot de autoatendimento foi desativado. Para reativar, renove sua assinatura em:\n` +
                                `https://${env.domain}/subscription`;

                            await this.evolutionService.sendText(
                                config.whatsappInstanceName,
                                config.whatsappNumber,
                                message
                            );
                            console.log(`[SubscriptionCheck] WhatsApp downgrade notification sent to ${config.whatsappNumber}`);
                        } catch (error: any) {
                            // Best effort — WhatsApp might be disconnected
                            console.warn(`[SubscriptionCheck] Failed to send WhatsApp notification:`, error.message);
                        }
                    }
                }
            }
        }

        return pastDueExpired.length;
    }
}
