import PDFDocument from 'pdfkit';
import { ISubscriptionPaymentRepository } from '../repositories/isubscription-payment-repository';
import { IUserRepository } from '../repositories/iuser-repository';

export class GenerateInvoicePdfUseCase {
    constructor(
        private readonly paymentRepository: ISubscriptionPaymentRepository,
        private readonly userRepository: IUserRepository
    ) {}

    async execute(paymentId: string, userId: string): Promise<Buffer> {
        const payment = await this.paymentRepository.findByBillingId(paymentId);
        if (!payment) throw new Error("Payment not found");

        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error("User not found");

        return new Promise((resolve, reject) => {
            // @ts-ignore
            const doc = new (PDFDocument as any)({ margin: 50 });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err: any) => reject(err));

            // --- PDF Content ---
            
            // Header
            doc.fillColor("#444444")
                .fontSize(20)
                .text("AgendaOk", 50, 50)
                .fontSize(10)
                .text("Comprovante de Pagamento", 200, 50, { align: "right" })
                .text(`Fatura #${payment.billingId}`, 200, 65, { align: "right" })
                .text(`Data: ${new Date(payment.createdAt).toLocaleDateString('pt-BR')}`, 200, 80, { align: "right" })
                .moveDown();

            doc.lineCap('butt')
                .moveTo(50, 100)
                .lineTo(550, 100)
                .stroke("#eeeeee");

            // User Info
            doc.fontSize(12)
                .fillColor("#333333")
                .text("Cliente:", 50, 120)
                .fontSize(10)
                .fillColor("#666666")
                .text(user.name, 50, 135)
                .text(user.email, 50, 150)
                .moveDown();

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
            doc.fontSize(12)
                .fillColor("#333333")
                .text("Total", 350, totalTop)
                .text(`R$ ${(payment.amount / 100).toFixed(2)}`, 450, totalTop, { align: "right" });

            // Footer
            doc.fontSize(10)
                .fillColor("#999999")
                .text("Obrigado por utilizar a AgendaOk!", 50, 700, { align: "center", width: 500 });

            doc.end();
        });
    }
}
