import { IMailService } from "../ports/imail-service";
import { env } from "../../infra/config/configs";
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
        nfseEmitted?: boolean
    ): Promise<void> {
        const subject = `✅ Assinatura ${planName} ativada com sucesso!`;

        const invoiceNote = nfseEmitted
            ? emailHighlightBox("Sua Nota Fiscal de Serviço (NFS-e) foi emitida com sucesso e será enviada ao seu e-mail pela prefeitura.", "success")
            : emailHighlightBox("Sua Nota Fiscal de Serviço (NFS-e) está sendo processada pela prefeitura e será enviada ao seu e-mail em breve.", "info");

        const content = `
            ${emailHeading(`Bem-vindo ao ${planName}, ${userName}!`)}
            ${emailText("Seu pagamento foi confirmado. Sua conta agora tem acesso completo a todos os recursos do plano.")}
            ${emailInfoBox([
                ["Plano", planName],
                ["Status", "Ativo ✓"],
            ])}
            ${emailHighlightBox("Você já pode configurar seu bot de atendimento WhatsApp, adicionar empresas e começar a automatizar seu atendimento.", "success")}
            ${invoiceNote}
            ${emailButton("Acessar o painel", `https://${env.domain}/dashboard`)}
            ${emailDivider()}
            ${emailText(`Obrigado por escolher o ${env.company.name}. Qualquer dúvida, estamos à disposição.`)}
        `;

        await this.mailService.sendMail(userEmail, subject, buildEmailTemplate(content));
    }

    async notifySubscriptionExpired(userEmail: string, userName: string): Promise<void> {
        const subject = "Sua assinatura expirou — renove para continuar";

        const content = `
            ${emailHeading(`Olá, ${userName}`)}
            ${emailText("Identificamos que o prazo de pagamento da sua assinatura expirou ou o checkout foi cancelado.")}
            ${emailHighlightBox("Seu acesso aos recursos do plano PRO foi <strong>suspenso</strong>. Seus dados estão preservados e podem ser recuperados ao renovar.", "warning")}
            ${emailText("Para continuar automatizando seu atendimento, renove sua assinatura diretamente no painel.")}
            ${emailButton("Renovar assinatura", `https://${env.domain}/subscription`)}
            ${emailDivider()}
            ${emailText(`Dúvidas? Fale com a gente pelo WhatsApp de suporte.`)}
        `;

        await this.mailService.sendMail(userEmail, subject, buildEmailTemplate(content));
    }

    async notifySubscriptionRefunded(userEmail: string, userName: string): Promise<void> {
        const subject = "Reembolso processado — confirmação";

        const content = `
            ${emailHeading(`Olá, ${userName}`)}
            ${emailText("Confirmamos que o reembolso da sua assinatura foi processado com sucesso.")}
            ${emailInfoBox([
                ["Status do reembolso", "Processado ✓"],
                ["Acesso premium", "Encerrado"],
            ])}
            ${emailHighlightBox("Se esta ação <strong>não foi solicitada por você</strong>, entre em contato com nosso suporte imediatamente via WhatsApp.", "warning")}
            ${emailDivider()}
            ${emailText(`Agradecemos por ter utilizado o ${env.company.name}.`)}
        `;

        await this.mailService.sendMail(userEmail, subject, buildEmailTemplate(content));
    }

    async notifyTrialStarted(
        userEmail: string,
        userName: string,
        planName: string,
        trialDays: number
    ): Promise<void> {
        const subject = `🎉 Seu período de teste do ${planName} foi ativado!`;

        const content = `
            ${emailHeading(`Olá, ${userName}!`)}
            ${emailText(`Seu período de teste do plano <strong>${planName}</strong> foi ativado com sucesso!`)}
            ${emailInfoBox([
                ["Plano", planName],
                ["Status", "Período de Teste"],
                ["Duração", `${trialDays} dias`],
                ["Cobrança", "Nenhuma durante o teste"],
            ])}
            ${emailHighlightBox(`Você tem <strong>${trialDays} dias</strong> para explorar todas as funcionalidades do plano ${planName} sem nenhum custo. Configure seu bot, conecte seu WhatsApp e comece agora.`, "info")}
            ${emailButton("Começar agora", `https://${env.domain}/dashboard`)}
            ${emailDivider()}
            ${emailText("A NFS-e será emitida somente após a confirmação do primeiro pagamento ao final do período de teste.")}
        `;

        await this.mailService.sendMail(userEmail, subject, buildEmailTemplate(content));
    }
}
