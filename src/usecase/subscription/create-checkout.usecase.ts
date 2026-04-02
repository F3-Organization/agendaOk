import { SubscriptionRepository } from "../../infra/database/repositories/subscription.repository";
import { UserRepository } from "../../infra/database/repositories/user.repository";
import { IPaymentGateway } from "../ports/ipayment-gateway";
import { env } from "../../infra/config/configs";
import { UserConfigRepository } from "../../infra/database/repositories/user-config.repository";
import { SubscriptionStatus } from "../../infra/database/entities/subscription.entity";
import { ISubscriptionPaymentRepository } from "../repositories/isubscription-payment-repository";
import { SubscriptionPaymentStatus } from "../../infra/database/entities/subscription-payment.entity";

export class CreateSubscriptionCheckoutUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly userConfigRepository: UserConfigRepository,
        private readonly paymentGateway: IPaymentGateway,
        private readonly paymentRepository: ISubscriptionPaymentRepository
    ) { }
    async execute(userId: string) {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error("User not found");

        const baseUrl = env.domain.startsWith('http') ? env.domain : `https://${env.domain}`;
        let subscription = await this.subscriptionRepository.findByUserId(userId);

        if (subscription?.status === SubscriptionStatus.ACTIVE) {
            return { url: subscription.checkoutUrl || `${baseUrl}/dashboard` };
        }

        if (subscription) {
            const pendingPayment = await this.paymentRepository.findPendingByUser(subscription.id);
            if (pendingPayment && pendingPayment.checkoutUrl) {
                return { url: pendingPayment.checkoutUrl };
            }
        }

        const userConfig = await this.userConfigRepository.findByUserId(userId);
        if (!userConfig?.whatsappNumber || !userConfig?.taxId) {
            throw new Error("User must configure WhatsApp Number and Tax ID (CPF/CNPJ) before checkout.");
        }

        let customerId = userConfig.billingCustomerId;
        if (!customerId) {
            const customer = await this.paymentGateway.createCustomer({
                name: user.name,
                email: user.email,
                cellphone: userConfig.whatsappNumber,
                taxId: userConfig.taxId
            });
            customerId = customer.id;
            
            // Salvar ID do cliente para futuras cobranças
            await this.userConfigRepository.update(userConfig.id, { billingCustomerId: customerId });
        }

        // 2. Garantir que o Produto existe no AbacatePay
        let product = await this.paymentGateway.findProductByName(env.abacatePay.planName);
        let productId = product?.id;

        if (!productId) {
            const newProduct = await this.paymentGateway.createProduct(
                env.abacatePay.planName,
                env.abacatePay.planPrice,
                "MONTHLY"
            );
            productId = newProduct.id;
        }

        // 3. Criar Assinatura (Recorrência)
        const subscriptionCheckout = await this.paymentGateway.createSubscription(
            customerId,
            productId,
            `${baseUrl}/subscription`
        );

        // Criar NOVO registro de assinatura PRO como PENDING
        const newSubscriptionData: any = {
            userId,
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

        return { url: subscriptionCheckout.url };
    }
}
