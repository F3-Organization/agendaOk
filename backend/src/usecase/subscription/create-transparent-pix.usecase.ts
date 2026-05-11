import { SubscriptionRepository } from "../../infra/database/repositories/subscription.repository";
import { UserRepository } from "../../infra/database/repositories/user.repository";
import { IPaymentGateway, TransparentPixResponse } from "../ports/ipayment-gateway";
import { CompanyConfigRepository } from "../../infra/database/repositories/company-config.repository";
import { ICompanyRepository } from "../repositories/icompany-repository";
import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";
import { ISubscriptionPaymentRepository } from "../repositories/isubscription-payment-repository";
import { SubscriptionPaymentStatus } from "../../infra/database/entities/subscription-payment.entity";
import { IPlanRepository } from "../repositories/iplan-repository";

const PIX_EXPIRES_IN_SECONDS = 30 * 60; // 30 minutes

export class CreateTransparentPixUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly companyConfigRepository: CompanyConfigRepository,
        private readonly companyRepository: ICompanyRepository,
        private readonly paymentGateway: IPaymentGateway,
        private readonly paymentRepository: ISubscriptionPaymentRepository,
        private readonly planRepository: IPlanRepository
    ) { }

    async execute(userId: string): Promise<TransparentPixResponse & { planName: string; amount: number }> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error("User not found");

        const purchasablePlan = await this.planRepository.findPurchasable();
        if (!purchasablePlan) throw new Error("No purchasable plan available.");

        const subscription = await this.subscriptionRepository.findByUserId(userId);
        if (subscription?.status === SubscriptionStatus.ACTIVE) {
            throw new Error("User already has an active subscription.");
        }

        const companies = await this.companyRepository.findByOwnerId(userId);
        if (companies.length === 0) throw new Error("User has no company configured.");
        const primaryCompany = companies[0]!;

        const companyConfig = await this.companyConfigRepository.findByCompanyId(primaryCompany.id);
        if (!companyConfig?.whatsappNumber || !companyConfig?.taxId) {
            throw new Error("User must configure WhatsApp Number and Tax ID (CPF/CNPJ) before checkout.");
        }

        const pix = await this.paymentGateway.createTransparentPix({
            amount: purchasablePlan.priceInCents,
            description: `${purchasablePlan.name} — ConfirmaZap`,
            expiresIn: PIX_EXPIRES_IN_SECONDS,
            customer: {
                name: user.name,
                email: user.email,
                taxId: companyConfig.taxId,
                cellphone: companyConfig.whatsappNumber,
            },
            metadata: { userId },
        });

        // Create or reuse pending subscription record
        let sub = subscription;
        if (!sub) {
            sub = await this.subscriptionRepository.save({
                userId,
                abacateBillingId: pix.id,
                plan: purchasablePlan.slug,
                status: SubscriptionStatus.PENDING,
            } as any);
        } else {
            // Update the billing ID to point to this new PIX
            await this.subscriptionRepository.save({
                id: sub.id,
                abacateBillingId: pix.id,
                status: SubscriptionStatus.PENDING,
            } as any);
        }

        await this.paymentRepository.create({
            subscriptionId: sub.id,
            billingId: pix.id,
            amount: purchasablePlan.priceInCents,
            status: SubscriptionPaymentStatus.PENDING,
        });

        return {
            ...pix,
            planName: purchasablePlan.name,
            amount: purchasablePlan.priceInCents,
        };
    }
}
