import { ISubscriptionPaymentRepository } from "../../usecase/repositories/isubscription-payment-repository";
import { ISubscriptionRepository } from "../../usecase/repositories/isubscription-repository";

export class GetSubscriptionPaymentHistoryUseCase {
    constructor(
        private readonly subscriptionRepository: ISubscriptionRepository,
        private readonly paymentRepository: ISubscriptionPaymentRepository
    ) {}

    async execute(companyId: string) {
        const subscription = await this.subscriptionRepository.findByCompanyId(companyId);
        if (!subscription) {
            return [];
        }

        const payments = await this.paymentRepository.findAllBySubscriptionId(subscription.id);
        return payments.map(payment => ({
            id: payment.id,
            status: payment.status,
            amount: payment.amount,
            paidAt: payment.paidAt,
            createdAt: payment.createdAt,
            checkoutUrl: payment.checkoutUrl
        }));
    }
}
