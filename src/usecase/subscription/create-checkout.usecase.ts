import { SubscriptionRepository } from "../../infra/database/repositories/subscription.repository";
import { UserRepository } from "../../infra/database/repositories/user.repository";
import { IPaymentGateway } from "../ports/ipayment-gateway";
import { env } from "../../infra/config/configs";
import { CompanyConfigRepository } from "../../infra/database/repositories/company-config.repository";
import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";
import { ISubscriptionPaymentRepository } from "../repositories/isubscription-payment-repository";
import { SubscriptionPaymentStatus } from "../../infra/database/entities/subscription-payment.entity";

export class CreateSubscriptionCheckoutUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly companyConfigRepository: CompanyConfigRepository,
        private readonly paymentGateway: IPaymentGateway,
        private readonly paymentRepository: ISubscriptionPaymentRepository
    ) { }
    async execute(companyId: string) {
        const user = await this.userRepository.findById(companyId);
        if (!user) throw new Error("User not found");

        const baseUrl = env.domain.startsWith('http') ? env.domain : `https://${env.domain}`;
        let subscription = await this.subscriptionRepository.findByCompanyId(companyId);

        if (subscription?.status === SubscriptionStatus.ACTIVE) {
            return { 
                url: subscription.checkoutUrl || `${baseUrl}/dashboard`,
                planName: env.abacatePay.planName,
                amount: env.abacatePay.planPrice
            };
        }

        if (subscription) {
            const pendingPayment = await this.paymentRepository.findPendingByUser(subscription.id);
            if (pendingPayment && pendingPayment.checkoutUrl) {
                return { 
                    url: pendingPayment.checkoutUrl,
                    planName: env.abacatePay.planName,
                    amount: env.abacatePay.planPrice
                };
            }
        }

        const userConfig = await this.companyConfigRepository.findByCompanyId(companyId);
        if (!userConfig?.whatsappNumber || !userConfig?.taxId) {
            throw new Error("User must configure WhatsApp Number and Tax ID (CPF/CNPJ) before checkout.");
        }

        let customerId = userConfig.billingCustomerId;
        let customerExists = false;

        if (customerId) {
            // Validar se o cliente ainda existe no AbacatePay (evita IDs obsoletos)
            const existingCustomer = await this.paymentGateway.getCustomer(customerId);
            if (existingCustomer) {
                customerExists = true;
            } else {
                console.warn(`[Checkout] Customer ID ${customerId} found in DB but not in AbacatePay. Re-creating...`);
            }
        }

        if (!customerId || !customerExists) {
            const customer = await this.paymentGateway.createCustomer({
                name: user.name,
                email: user.email,
                cellphone: userConfig.whatsappNumber,
                taxId: userConfig.taxId
            });
            customerId = customer.id;
            
            // Salvar ID do cliente para futuras cobranças
            await this.companyConfigRepository.updateByCompanyId(userConfig.id, { billingCustomerId: customerId });
        }

        // 2. Criar Assinatura (Recorrência) diretamente via Billing (V1)
        const subscriptionCheckout = await this.paymentGateway.createSubscription(
            customerId,
            env.abacatePay.planName,
            env.abacatePay.planPrice,
            `${baseUrl}/subscription`,
            { companyId }
        );

        // Criar NOVO registro de assinatura PRO como PENDING
        const newSubscriptionData: any = {
            companyId,
            abacateBillingId: subscriptionCheckout.id,
            abacateCustomerId: customerId,
            checkoutUrl: subscriptionCheckout.url,
            plan: "PRO",
            status: SubscriptionStatus.PENDING
        };

        const newSubscription = await this.subscriptionRepository.save(newSubscriptionData);

        // Criar registro de pagamento histórico (PENDENTE)
        await this.paymentRepository.create({
            subscriptionId: newSubscription.id,
            billingId: subscriptionCheckout.id,
            amount: env.abacatePay.planPrice,
            status: SubscriptionPaymentStatus.PENDING,
            checkoutUrl: subscriptionCheckout.url
        });

        return { 
            url: subscriptionCheckout.url,
            planName: env.abacatePay.planName,
            amount: env.abacatePay.planPrice
        };
    }
}
