import { SubscriptionRepository } from "../../infra/database/repositories/subscription.repository";
import { UserRepository } from "../../infra/database/repositories/user.repository";
import { IPaymentGateway } from "../ports/ipayment-gateway";
import { env } from "../../infra/config/configs";
import { CompanyConfigRepository } from "../../infra/database/repositories/company-config.repository";
import { ICompanyRepository } from "../repositories/icompany-repository";
import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";
import { ISubscriptionPaymentRepository } from "../repositories/isubscription-payment-repository";
import { SubscriptionPaymentStatus } from "../../infra/database/entities/subscription-payment.entity";
import { IPlanRepository } from "../repositories/iplan-repository";

export class CreateSubscriptionCheckoutUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly companyConfigRepository: CompanyConfigRepository,
        private readonly companyRepository: ICompanyRepository,
        private readonly paymentGateway: IPaymentGateway,
        private readonly paymentRepository: ISubscriptionPaymentRepository,
        private readonly planRepository: IPlanRepository
    ) { }

    async execute(userId: string) {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error("User not found");

        const purchasablePlan = await this.planRepository.findPurchasable();
        if (!purchasablePlan) throw new Error("No purchasable plan available.");

        const baseUrl = env.domain;
        const subscription = await this.subscriptionRepository.findByUserId(userId);

        if (subscription?.status === SubscriptionStatus.ACTIVE) {
            return {
                url: subscription.checkoutUrl || `${baseUrl}/dashboard`,
                planName: purchasablePlan.name,
                amount: purchasablePlan.priceInCents
            };
        }

        if (subscription) {
            const pendingPayment = await this.paymentRepository.findPendingByUser(subscription.id);
            if (pendingPayment && pendingPayment.checkoutUrl) {
                return {
                    url: pendingPayment.checkoutUrl,
                    planName: purchasablePlan.name,
                    amount: purchasablePlan.priceInCents
                };
            }
        }

        const companies = await this.companyRepository.findByOwnerId(userId);
        if (companies.length === 0) throw new Error("User has no company configured.");
        const primaryCompany = companies[0]!;

        const companyConfig = await this.companyConfigRepository.findByCompanyId(primaryCompany.id);
        if (!companyConfig?.whatsappNumber || !companyConfig?.taxId) {
            throw new Error("User must configure WhatsApp Number and Tax ID (CPF/CNPJ) before checkout.");
        }

        let customerId = companyConfig.billingCustomerId;
        let customerExists = false;

        if (customerId) {
            const existingCustomer = await this.paymentGateway.getCustomer(customerId);
            if (existingCustomer) {
                customerExists = true;
            }
        }

        if (!customerId || !customerExists) {
            const customer = await this.paymentGateway.createCustomer({
                name: user.name,
                email: user.email,
                cellphone: companyConfig.whatsappNumber,
                taxId: companyConfig.taxId
            });
            customerId = customer.id;
            await this.companyConfigRepository.updateByCompanyId(primaryCompany.id, { billingCustomerId: customerId });
        }

        const subscriptionCheckout = await this.paymentGateway.createSubscription(
            customerId,
            purchasablePlan.name,
            purchasablePlan.priceInCents,
            `${baseUrl}/subscription`,
            { userId }
        );

        const newSubscription = await this.subscriptionRepository.save({
            userId,
            abacateBillingId: subscriptionCheckout.id,
            abacateCustomerId: customerId,
            checkoutUrl: subscriptionCheckout.url,
            plan: purchasablePlan.slug,
            status: SubscriptionStatus.PENDING
        } as any);

        await this.paymentRepository.create({
            subscriptionId: newSubscription.id,
            billingId: subscriptionCheckout.id,
            amount: purchasablePlan.priceInCents,
            status: SubscriptionPaymentStatus.PENDING,
            checkoutUrl: subscriptionCheckout.url
        });

        return {
            url: subscriptionCheckout.url,
            planName: purchasablePlan.name,
            amount: purchasablePlan.priceInCents
        };
    }
}
