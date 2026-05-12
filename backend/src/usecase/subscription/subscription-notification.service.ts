import { IMailService } from "../ports/imail-service";
import { env } from "../../infra/config/configs";
import { t, type Locale } from "../../shared/i18n";
import {
    buildEmailTemplate,
    emailHeading,
    emailText,
    emailInfoBox,
    emailHighlightBox,
    emailButton,
    emailDivider,
} from "../../shared/utils/email-template";

export class SubscriptionNotificationService {
    constructor(private readonly mailService: IMailService) {}

    async notifyPaymentSuccess(
        userEmail: string,
        userName: string,
        planName: string,
        nfseEmitted?: boolean,
        locale: Locale = "pt"
    ): Promise<void> {
        const subject = t(locale, "email.payment.subject", { planName });

        const invoiceNote = nfseEmitted
            ? emailHighlightBox(t(locale, "email.payment.nfseEmitted"), "success")
            : emailHighlightBox(t(locale, "email.payment.nfsePending"), "info");

        const content = `
            ${emailHeading(t(locale, "email.payment.heading", { planName, userName }))}
            ${emailText(t(locale, "email.payment.body"))}
            ${emailInfoBox([
                [t(locale, "email.payment.statusLabel"), t(locale, "email.payment.statusValue")],
            ])}
            ${emailHighlightBox(t(locale, "email.payment.cta"), "success")}
            ${invoiceNote}
            ${emailButton(t(locale, "email.payment.button"), `https://${env.domain}/dashboard`)}
            ${emailDivider()}
            ${emailText(t(locale, "email.payment.footer", { companyName: env.company.name }))}
        `;

        await this.mailService.sendMail(userEmail, subject, buildEmailTemplate(content, locale));
    }

    async notifySubscriptionExpired(userEmail: string, userName: string, locale: Locale = "pt"): Promise<void> {
        const subject = t(locale, "email.expired.subject");

        const content = `
            ${emailHeading(t(locale, "email.expired.heading", { userName }))}
            ${emailText(t(locale, "email.expired.body"))}
            ${emailHighlightBox(t(locale, "email.expired.highlight"), "warning")}
            ${emailText(t(locale, "email.expired.body2"))}
            ${emailButton(t(locale, "email.expired.button"), `https://${env.domain}/subscription`)}
            ${emailDivider()}
            ${emailText(t(locale, "email.expired.support"))}
        `;

        await this.mailService.sendMail(userEmail, subject, buildEmailTemplate(content, locale));
    }

    async notifySubscriptionRefunded(userEmail: string, userName: string, locale: Locale = "pt"): Promise<void> {
        const subject = t(locale, "email.refund.subject");

        const content = `
            ${emailHeading(t(locale, "email.refund.heading", { userName }))}
            ${emailText(t(locale, "email.refund.body"))}
            ${emailInfoBox([
                [t(locale, "email.refund.statusLabel"), t(locale, "email.refund.statusValue")],
                [t(locale, "email.refund.accessLabel"), t(locale, "email.refund.accessValue")],
            ])}
            ${emailHighlightBox(t(locale, "email.refund.warning"), "warning")}
            ${emailDivider()}
            ${emailText(t(locale, "email.refund.footer", { companyName: env.company.name }))}
        `;

        await this.mailService.sendMail(userEmail, subject, buildEmailTemplate(content, locale));
    }

    async notifyTrialStarted(
        userEmail: string,
        userName: string,
        planName: string,
        trialDays: number,
        locale: Locale = "pt"
    ): Promise<void> {
        const subject = t(locale, "email.trial.subject", { planName });

        const content = `
            ${emailHeading(t(locale, "email.trial.heading", { userName }))}
            ${emailText(t(locale, "email.trial.body", { planName }))}
            ${emailInfoBox([
                [t(locale, "email.trial.statusLabel"), t(locale, "email.trial.statusValue")],
                [t(locale, "email.trial.durationLabel"), t(locale, "email.trial.durationValue", { trialDays })],
                [t(locale, "email.trial.billingLabel"), t(locale, "email.trial.billingValue")],
            ])}
            ${emailHighlightBox(t(locale, "email.trial.highlight", { trialDays, planName }), "info")}
            ${emailButton(t(locale, "email.trial.button"), `https://${env.domain}/dashboard`)}
            ${emailDivider()}
            ${emailText(t(locale, "email.trial.nfseNote"))}
        `;

        await this.mailService.sendMail(userEmail, subject, buildEmailTemplate(content, locale));
    }
}
