import { AppDataSource } from "../../config/data-source";
import { Plan } from "../entities/plan.entity";

export async function seedPlansIfEmpty() {
    const planRepo = AppDataSource.getRepository(Plan);
    const count = await planRepo.count();
    if (count > 0) return;

    await planRepo.save([
        {
            slug: "FREE",
            name: "ConfirmaZap Free",
            description: "Plano gratuito para começar a usar o ConfirmaZap.",
            priceInCents: 0,
            messageLimit: 50,
            maxDevices: 1,
            features: ["50 confirmações/mês", "1 dispositivo WhatsApp", "Suporte por email", "Relatórios básicos"],
            isActive: true,
            isPurchasable: false,
            sortOrder: 0,
        },
        {
            slug: "PRO",
            name: "ConfirmaZap Pro",
            description: "Plano profissional com confirmações ilimitadas e recursos avançados.",
            priceInCents: 4990,
            messageLimit: null,
            maxDevices: 3,
            features: ["Confirmações ilimitadas", "3 dispositivos WhatsApp", "Suporte prioritário", "Acesso à API", "Sem marca d'água"],
            isActive: true,
            isPurchasable: true,
            sortOrder: 1,
        },
    ]);
    console.log("[Bootstrap] Plans seeded successfully.");
}