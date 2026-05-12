import { IMailService } from "../ports/imail-service";
import { RedisService } from "../../infra/database/redis.service";
import { t, type Locale } from "../../shared/i18n";
import {
    buildEmailTemplate,
    emailHeading,
    emailText,
    emailCodeBlock,
    emailHighlightBox,
} from "../../shared/utils/email-template";

export class SendEmailVerificationUseCase {
    constructor(
        private readonly mailService: IMailService,
        private readonly redisService: RedisService
    ) {}

    async execute(email: string, locale: Locale = "pt"): Promise<void> {
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await this.redisService.set(`verify_email:${email}`, code, 900);

        const subject = t(locale, "email.verification.subject");

        const content = `
            ${emailHeading(t(locale, "email.verification.heading"))}
            ${emailText(t(locale, "email.verification.body"))}
            ${emailCodeBlock(code)}
            ${emailHighlightBox(t(locale, "email.verification.expiry"), "warning")}
            ${emailText(t(locale, "email.verification.support"))}
        `;

        await this.mailService.sendMail(email, subject, buildEmailTemplate(content, locale));
    }
}
