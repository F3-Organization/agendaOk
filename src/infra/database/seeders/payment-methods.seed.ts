import { AppDataSource } from "../../config/data-source";
import { PaymentMethod } from "../entities/payment-method.entity";

export async function seedPaymentMethods(): Promise<void> {
    const repo = AppDataSource.getRepository(PaymentMethod);
    const METHODS = [
        { code: "PIX", name: "PIX", description: "Pagamento instantâneo via PIX" },
        { code: "CREDIT_CARD", name: "Cartão de Crédito", description: "Cartão de crédito" },
        { code: "DEBIT_CARD", name: "Cartão de Débito", description: "Cartão de débito" },
        { code: "BOLETO", name: "Boleto Bancário", description: "Boleto bancário" },
    ];
    await repo
        .createQueryBuilder()
        .insert()
        .into(PaymentMethod)
        .values(METHODS)
        .orUpdate(['name', 'description'], ['code'])
        .execute();
    console.log("[Bootstrap] Payment methods seeded.");
}