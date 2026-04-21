import { IMailService } from "../ports/imail-service";
import { env } from "../../infra/config/configs";

export class SubscriptionNotificationService {
    constructor(private readonly mailService: IMailService) {}

    async notifyPaymentSuccess(userEmail: string, userName: string, planName: string, nfseEmitted?: boolean): Promise<void> {
        const subject = `Assinatura ${planName} Ativada com Sucesso!`;

        const invoiceBlock = nfseEmitted
            ? `<div style="margin: 20px 0; padding: 15px; background: #dcfce7; border-radius: 8px; border-left: 4px solid #16a34a;">
                    <strong>📄 Nota Fiscal de Serviço (NFS-e)</strong><br>
                    <p style="margin: 8px 0 0 0;">Sua NFS-e foi emitida com sucesso e será enviada ao seu email pela prefeitura.</p>
                </div>`
            : `<p style="color: #6b7280; font-size: 13px;">📄 Sua Nota Fiscal de Serviço (NFS-e) está sendo processada pela prefeitura e será enviada ao seu email em breve.</p>`;

        const body = `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                <h2>Olá, ${userName}!</h2>
                <p>Boas notícias! Recebemos a confirmação do seu pagamento para o plano <strong>${planName}</strong>.</p>
                <p>Sua conta agora possui acesso ilimitado a todas as ferramentas do ${env.company.name}.</p>
                <div style="margin: 20px 0; padding: 15px; background: #f4f4f4; border-radius: 8px;">
                    <strong>Plano:</strong> ${planName}<br>
                    <strong>Status:</strong> Ativo
                </div>
                ${invoiceBlock}
                <p>Aproveite ao máximo suas notificações automáticas!</p>
                <p>Equipe ${env.company.name}</p>
            </div>
        `;
        await this.mailService.sendMail(userEmail, subject, body);
    }

    async notifySubscriptionExpired(userEmail: string, userName: string): Promise<void> {
        const subject = "Sua assinatura expirou";
        const body = `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                <h2>Olá, ${userName},</h2>
                <p>Identificamos que o prazo de pagamento da sua assinatura expirou ou o checkout foi cancelado.</p>
                <p>Para continuar aproveitando os benefícios do plano PRO, você pode iniciar um novo checkout diretamente no dashboard.</p>
                <p>Se tiver alguma dúvida, entre em contato com nosso suporte via WhatsApp: ${env.company.supportWhatsapp}</p>
                <p>Equipe ${env.company.name}</p>
            </div>
        `;
        await this.mailService.sendMail(userEmail, subject, body);
    }

    async notifySubscriptionRefunded(userEmail: string, userName: string): Promise<void> {
        const subject = "Confirmação de Reembolso";
        const body = `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                <h2>Olá, ${userName},</h2>
                <p>Confirmamos que o reembolso da sua assinatura foi processado com sucesso.</p>
                <p>Seu acesso ao plano pago foi revogado. Caso esta ação não tenha sido solicitada por você, entre em contato conosco imediatamente.</p>
                <p>Suporte: ${env.company.supportWhatsapp}</p>
                <p>Equipe ${env.company.name}</p>
            </div>
        `;
        await this.mailService.sendMail(userEmail, subject, body);
    }
}
