import { IMailService } from "../ports/imail-service";
import { RedisService } from "../../infra/database/redis.service";

export class SendEmailVerificationUseCase {
    constructor(
        private readonly mailService: IMailService,
        private readonly redisService: RedisService
    ) {}

    async execute(email: string): Promise<void> {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store code in Redis for 15 minutes
        await this.redisService.set(`verify_email:${email}`, code, 900);

        const subject = "ConfirmaZap - Verificação de E-mail";
        const body = `
            <h1>Verificação de E-mail</h1>
            <p>Seu código de verificação para definir sua senha é:</p>
            <h2 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px;">${code}</h2>
            <p>Este código expira em 15 minutos.</p>
        `;

        await this.mailService.sendMail(email, subject, body);
        console.log(`[SendEmailVerificationUseCase] Code ${code} sent to ${email}`);
    }
}
