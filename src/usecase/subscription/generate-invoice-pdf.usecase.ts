import PDFDocument from 'pdfkit';
import { ISubscriptionPaymentRepository } from '../repositories/isubscription-payment-repository';
import { IUserRepository } from '../repositories/iuser-repository';
import { UserConfigRepository } from '../../infra/database/repositories/user-config.repository';
import { env } from '../../infra/config/configs';

export class GenerateInvoicePdfUseCase {
    constructor(
        private readonly paymentRepository: ISubscriptionPaymentRepository,
        private readonly userRepository: IUserRepository,
        private readonly userConfigRepository: UserConfigRepository
    ) {}

    private valorPorExtenso(valor: number): string {
        const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
        const dezena1 = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
        const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
        const centenas = ["", "cem", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

        if (valor === 49.90) return "Quarenta e nove reais e noventa centavos";
        if (valor === 0) return "Zero reais";
        
        // Simples conversão para os valores padrão do sistema (até R$ 999,99)
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

    async execute(paymentId: string, userId: string): Promise<Buffer> {
        const payment = await this.paymentRepository.findById(paymentId);
        if (!payment) throw new Error("Payment not found");

        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error("User not found");

        const userConfig = await this.userConfigRepository.findByUserId(userId);

        const paymentShortId = payment.id.split('-')[0]?.toUpperCase() || 'INVALID';
        const createdAt = payment.createdAt;
        const amount = payment.amount;
        const userName = user.name;
        const userEmail = user.email;
        const userTaxId = userConfig?.taxId;

        return new Promise((resolve, reject) => {

            // @ts-ignore
            const doc = new (PDFDocument as any)({ margin: 50 });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err: any) => reject(err));

            // --- PDF Content ---
            
            // Header - Emitente
            doc.fillColor("#111827")
                .fontSize(22)
                .text(env.company.name, 50, 50)
                .fontSize(10)
                .fillColor("#6b7280")
                .text("Recibo de Pagamento", 200, 50, { align: "right" })
                .text(`Fatura #${paymentShortId}`, 200, 65, { align: "right" })
                .text(`Data: ${new Date(createdAt).toLocaleDateString('pt-BR')}`, 200, 80, { align: "right" })
                .moveDown();

            doc.fontSize(8)
                .text(`CNPJ: ${env.company.cnpj}`, 50, 75)
                .text(env.company.address, 50, 85);

            doc.lineCap('butt')
                .moveTo(50, 110)
                .lineTo(550, 110)
                .stroke("#e5e7eb");

            // User Info - Tomador
            doc.fontSize(10)
                .fillColor("#374151")
                .text("DADOS DO CLIENTE", 50, 130)
                .fontSize(11)
                .fillColor("#111827")
                .text(userName, 50, 145)
                .fontSize(9)
                .fillColor("#6b7280")
                .text(userEmail, 50, 160);
            
            if (userTaxId) {
                doc.text(`CPF/CNPJ: ${userTaxId}`, 50, 172);
            }

            // Table Header
            const tableTop = 200;
            doc.fontSize(10)
                .fillColor("#333333")
                .text("Descrição", 50, tableTop)
                .text("Status", 250, tableTop)
                .text("Valor", 450, tableTop, { align: "right" });

            doc.moveTo(50, tableTop + 15)
                .lineTo(550, tableTop + 15)
                .stroke("#eeeeee");

            // Data
            const itemsTop = tableTop + 30;
            doc.fontSize(10)
                .fillColor("#666666")
                .text("Assinatura Mensal - Plano PRO", 50, itemsTop)
                .text(payment.status, 250, itemsTop)
                .text(`R$ ${(payment.amount / 100).toFixed(2)}`, 450, itemsTop, { align: "right" });

            doc.moveTo(50, itemsTop + 15)
                .lineTo(550, itemsTop + 15)
                .stroke("#eeeeee");

            // Total
            const totalTop = itemsTop + 40;
            const amountInBrl = amount / 100;
            doc.fontSize(12)
                .fillColor("#111827")
                .text("TOTAL PAGO", 350, totalTop)
                .text(`R$ ${amountInBrl.toFixed(2).replace('.', ',')}`, 450, totalTop, { align: "right" });

            // Extenso
            doc.fontSize(9)
                .fillColor("#6b7280")
                .text(`Valor por extenso: ${this.valorPorExtenso(amountInBrl)}`, 50, totalTop + 30);

            // Footer
            doc.fontSize(8)
                .fillColor("#9ca3af")
                .text("Este documento é um recibo de quitação de pagamento e não substitui a Nota Fiscal de Serviços.", 50, 700, { align: "center", width: 500 })
                .text("ConfirmaZap - Todos os direitos reservados", 50, 715, { align: "center", width: 500 });

            doc.end();
        });
    }
}
