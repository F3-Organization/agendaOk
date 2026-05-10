import { IMailService } from "../ports/imail-service";
import { RedisService } from "../../infra/database/redis.service";
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

    async execute(email: string): Promise<void> {
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await this.redisService.set(`verify_email:${email}`, code, 900);

        const subject = "ConfirmaZap — Seu código de verificação";

        const content = `
            ${emailHeading("Verificação de e-mail")}
            ${emailText("Olá! Use o código abaixo para verificar seu endereço de e-mail e definir sua senha.")}
            ${emailCodeBlock(code)}
            ${emailHighlightBox("Este código é válido por <strong>15 minutos</strong>. Se você não solicitou o cadastro, pode ignorar este e-mail.", "warning")}
            ${emailText("Caso tenha dúvidas, entre em contato com nosso suporte.")}
        `;

        await this.mailService.sendMail(email, subject, buildEmailTemplate(content));
        console.log(`[SendEmailVerificationUseCase] Verification code sent to ${email}`);
    }
}
