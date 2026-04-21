import PDFDocument from 'pdfkit';
import { ISubscriptionPaymentRepository } from '../repositories/isubscription-payment-repository';
import { IUserRepository } from '../repositories/iuser-repository';
import { CompanyConfigRepository } from '../../infra/database/repositories/company-config.repository';
import { env } from '../../infra/config/configs';

const BRAND_COLOR = '#16a34a';
const BRAND_LIGHT = '#dcfce7';
const DARK = '#111827';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';
const TABLE_HDR = '#f3f4f6';

export class GenerateInvoicePdfUseCase {
    constructor(
        private readonly paymentRepository: ISubscriptionPaymentRepository,
        private readonly userRepository: IUserRepository,
        private readonly companyConfigRepository: CompanyConfigRepository
    ) { }

    private valorPorExtenso(valor: number): string {
        const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
        const dezena1 = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
        const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];

        if (valor === 0) return "Zero reais";

        const reais = Math.floor(valor);
        const centavos = Math.round((valor - reais) * 100);

        let extenso = "";

        if (reais > 0) {
            if (reais < 10) extenso += unidades[reais];
            else if (reais < 20) extenso += dezena1[reais - 10];
            else {
                const d = Math.floor(reais / 10);
                const u = reais % 10;
                extenso += dezenas[d] + (u > 0 ? " e " + unidades[u] : "");
            }
            extenso += reais === 1 ? " real" : " reais";
        }

        if (centavos > 0) {
            extenso += (reais > 0 ? " e " : "");
            if (centavos < 10) extenso += unidades[centavos];
            else if (centavos < 20) extenso += dezena1[centavos - 10];
            else {
                const d = Math.floor(centavos / 10);
                const u = centavos % 10;
                extenso += dezenas[d] + (u > 0 ? " e " + unidades[u] : "");
            }
            extenso += centavos === 1 ? " centavo" : " centavos";
        }

        return extenso.charAt(0).toUpperCase() + extenso.slice(1);
    }

    private formatPaymentMethod(method?: string | null): string {
        if (!method) return "—";
        const map: Record<string, string> = {
            pix: "PIX",
            credit_card: "Cartão de Crédito",
            debit_card: "Cartão de Débito",
            boleto: "Boleto Bancário",
            CREDIT_CARD: "Cartão de Crédito",
            DEBIT_CARD: "Cartão de Débito",
            PIX: "PIX",
            BOLETO: "Boleto Bancário",
        };
        return map[method] ?? method;
    }

    async execute(paymentId: string, userId: string): Promise<Buffer> {
        const payment = await this.paymentRepository.findById(paymentId);
        if (!payment) throw new Error("Payment not found");

        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error("User not found");

        const userConfig = await this.companyConfigRepository.findByCompanyId(userId);

        const paymentShortId = payment.id.split('-')[0]?.toUpperCase() || 'INVALID';
        const issueDate = new Date(payment.paidAt || payment.createdAt);
        const amountInBrl = payment.amount / 100;
        const paymentMethodLabel = this.formatPaymentMethod(payment.paymentMethod?.code);

        return new Promise((resolve, reject) => {
            // @ts-ignore
            const doc = new (PDFDocument as any)({ margin: 0, size: 'A4' });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err: any) => reject(err));

            const PW = 595.28;
            const PH = 841.89;

            // ── Top accent bar ──────────────────────────────────────────
            doc.rect(0, 0, PW, 6).fill(BRAND_COLOR);

            // ── Header card ─────────────────────────────────────────────
            const hdrH = 110;
            doc.rect(0, 6, PW, hdrH).fill('#ffffff');

            // Company name
            doc.fillColor(DARK)
                .fontSize(22)
                .font('Helvetica-Bold')
                .text(env.company.name, 50, 26, { lineBreak: false });

            // "Recibo de Pagamento" badge (right side)
            const badgeX = PW - 200;
            doc.roundedRect(badgeX, 26, 150, 22, 4).fill(BRAND_LIGHT);
            doc.fillColor(BRAND_COLOR)
                .fontSize(9)
                .font('Helvetica-Bold')
                .text('RECIBO DE PAGAMENTO', badgeX, 31, { width: 150, align: 'center' });

            // Company details
            doc.fillColor(MUTED)
                .fontSize(8.5)
                .font('Helvetica')
                .text(`CNPJ: ${env.company.cnpj}`, 50, 55)
                .text(env.company.address, 50, 67);

            // Invoice meta (right)
            doc.fillColor(MUTED)
                .fontSize(8.5)
                .text(`Fatura Nº: ${paymentShortId}`, badgeX, 58, { width: 150 })
                .text(`Data: ${issueDate.toLocaleDateString('pt-BR')}`, badgeX, 70, { width: 150 });

            // ── Thin divider ─────────────────────────────────────────────
            const divY = hdrH + 6;
            doc.rect(0, divY, PW, 1).fill(BORDER);

            // ── Two-column info row ──────────────────────────────────────
            const infoY = divY + 20;
            const colW = (PW - 100) / 2;

            // Emitente box
            doc.rect(50, infoY, colW - 10, 80).strokeColor(BORDER).lineWidth(0.5).stroke();
            doc.fillColor(BRAND_COLOR).fontSize(7).font('Helvetica-Bold')
                .text('EMITENTE', 60, infoY + 8);
            doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
                .text(env.company.name, 60, infoY + 20);
            doc.fillColor(MUTED).fontSize(8).font('Helvetica')
                .text(`CNPJ: ${env.company.cnpj}`, 60, infoY + 35)
                .text(env.company.address, 60, infoY + 47, { width: colW - 30 });

            // Tomador box
            const tomX = 50 + colW + 10;
            doc.rect(tomX, infoY, colW, 80).strokeColor(BORDER).lineWidth(0.5).stroke();
            doc.fillColor(BRAND_COLOR).fontSize(7).font('Helvetica-Bold')
                .text('TOMADOR', tomX + 10, infoY + 8);
            doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
                .text(user.name, tomX + 10, infoY + 20, { width: colW - 20 });
            doc.fillColor(MUTED).fontSize(8).font('Helvetica')
                .text(user.email, tomX + 10, infoY + 35, { width: colW - 20 });
            if (userConfig?.taxId) {
                doc.text(`CPF/CNPJ: ${userConfig.taxId}`, tomX + 10, infoY + 47);
            }

            // ── Services table ───────────────────────────────────────────
            const tableY = infoY + 100 + 10;

            // Table header row
            doc.rect(50, tableY, PW - 100, 24).fill(TABLE_HDR);
            doc.fillColor(MUTED).fontSize(8).font('Helvetica-Bold')
                .text('DESCRIÇÃO', 60, tableY + 8)
                .text('QTD', 320, tableY + 8, { width: 40, align: 'center' })
                .text('MÉTODO', 375, tableY + 8, { width: 90, align: 'center' })
                .text('VALOR', PW - 100, tableY + 8, { width: 50, align: 'right' });

            // Table data row
            const rowY = tableY + 24;
            doc.rect(50, rowY, PW - 100, 32).strokeColor(BORDER).lineWidth(0.5).stroke();
            doc.fillColor(DARK).fontSize(9.5).font('Helvetica')
                .text('Assinatura Mensal — Plano PRO', 60, rowY + 10, { width: 250 });
            doc.fillColor(MUTED).fontSize(9).font('Helvetica')
                .text('1', 320, rowY + 10, { width: 40, align: 'center' })
                .text(paymentMethodLabel, 375, rowY + 10, { width: 90, align: 'center' });
            doc.fillColor(DARK).fontSize(9.5).font('Helvetica-Bold')
                .text(`R$ ${amountInBrl.toFixed(2).replace('.', ',')}`, PW - 100, rowY + 10, { width: 50, align: 'right' });

            // ── Total block ──────────────────────────────────────────────
            const totalY = rowY + 32 + 16;
            const totalBlockW = 200;
            const totalBlockX = PW - 50 - totalBlockW;

            doc.rect(totalBlockX, totalY, totalBlockW, 56).fill(BRAND_LIGHT);
            doc.fillColor(MUTED).fontSize(8).font('Helvetica-Bold')
                .text('TOTAL PAGO', totalBlockX + 12, totalY + 10);
            doc.fillColor(BRAND_COLOR).fontSize(22).font('Helvetica-Bold')
                .text(`R$ ${amountInBrl.toFixed(2).replace('.', ',')}`, totalBlockX, totalY + 22, { width: totalBlockW - 12, align: 'right' });

            // Status badge
            doc.roundedRect(50, totalY + 8, 100, 22, 4).fill('#dcfce7');
            doc.fillColor(BRAND_COLOR).fontSize(9).font('Helvetica-Bold')
                .text('PAGO', 50, totalY + 14, { width: 100, align: 'center' });

            // Extenso
            doc.fillColor(MUTED).fontSize(8).font('Helvetica')
                .text(`Por extenso: ${this.valorPorExtenso(amountInBrl)}`, 50, totalY + 68);

            // ── Notes box ────────────────────────────────────────────────
            const notesY = totalY + 90;
            doc.rect(50, notesY, PW - 100, 50).strokeColor(BORDER).lineWidth(0.5).stroke();
            doc.fillColor(BRAND_COLOR).fontSize(7).font('Helvetica-Bold')
                .text('OBSERVAÇÕES', 60, notesY + 8);
            doc.fillColor(MUTED).fontSize(8).font('Helvetica')
                .text(
                    'Este documento comprova o pagamento da assinatura do serviço ConfirmaZap. ' +
                    'Guarde-o para fins de controle financeiro.',
                    60, notesY + 20, { width: PW - 120 }
                );

            // ── Footer ───────────────────────────────────────────────────
            const footerY = PH - 60;
            doc.rect(0, footerY - 6, PW, 1).fill(BORDER);
            doc.rect(0, footerY - 5, PW, 65).fill('#f9fafb');

            doc.fillColor(MUTED).fontSize(7.5).font('Helvetica')
                .text(
                    'Este documento é um recibo de quitação de pagamento e não substitui a Nota Fiscal de Serviços (NFS-e).',
                    50, footerY + 4, { align: 'center', width: PW - 100 }
                )
                .text(
                    `NFS-e emitida via BrasilNFe — https://www.brasilnfe.com.br/`,
                    50, footerY + 18, { align: 'center', width: PW - 100 }
                )
                .text(
                    `${env.company.name}  ·  CNPJ ${env.company.cnpj}  ·  Todos os direitos reservados`,
                    50, footerY + 32, { align: 'center', width: PW - 100 }
                );

            // Bottom accent bar
            doc.rect(0, PH - 6, PW, 6).fill(BRAND_COLOR);

            doc.end();
        });
    }
}
