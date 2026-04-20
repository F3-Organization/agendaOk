import { describe, it, expect, vi, beforeEach } from "vitest";
import { HandleAbacatePayWebhookUseCase } from "../handle-abacate-webhook.usecase";
import { SubscriptionRepository } from "../../../infra/database/repositories/subscription.repository";
import { SubscriptionStatus } from "../../../infra/database/entities/subscription.entity";

describe("HandleAbacatePayWebhookUseCase", () => {
    let sut: HandleAbacatePayWebhookUseCase;
    let subscriptionRepository: SubscriptionRepository;
    let paymentRepository: any;
    let userRepository: any;
    let companyConfigRepository: any;
    let notificationService: any;
    let fiscalAdapter: any;

    beforeEach(() => {
        subscriptionRepository = {
            findByBillingId: vi.fn(),
            updateStatus: vi.fn(),
            findByUserId: vi.fn(),
            createOrUpdate: vi.fn(),
            deactivateOthers: vi.fn()
        } as any;

        paymentRepository = {
            findByBillingId: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            findPendingByUser: vi.fn()
        };

        userRepository = {
            findById: vi.fn()
        };

        companyConfigRepository = {
            findByCompanyId: vi.fn()
        };

        notificationService = {
            notifyPaymentSuccess: vi.fn(),
            notifySubscriptionExpired: vi.fn(),
            notifySubscriptionRefunded: vi.fn()
        };

        fiscalAdapter = {
            emitirNfse: vi.fn()
        };

        sut = new HandleAbacatePayWebhookUseCase(
            subscriptionRepository,
            paymentRepository,
            userRepository,
            companyConfigRepository,
            notificationService,
            fiscalAdapter
        );
    });

    it("deve ativar a assinatura quando o evento for billing.paid", async () => {
        const payload = {
            event: "billing.paid",
            data: { id: "billing-123" }
        };

        const mockSubscription = { id: "sub-1", userId: "user-1" };
        vi.mocked(subscriptionRepository.findByBillingId).mockResolvedValueOnce(mockSubscription as any);
        paymentRepository.findByBillingId.mockResolvedValueOnce({ id: "pay-1" });

        const result = await sut.execute(payload);

        expect(subscriptionRepository.updateStatus).toHaveBeenCalledWith(
            "sub-1",
            "user-1",
            SubscriptionStatus.ACTIVE,
            expect.any(Date),
            "PRO"
        );
        expect(result.status).toBe("processed");
    });

    it("não deve fazer nada se a assinatura não for encontrada", async () => {
        const payload = {
            event: "billing.paid",
            data: { id: "billing-not-found" }
        };

        vi.mocked(subscriptionRepository.findByBillingId).mockResolvedValueOnce(null);

        await sut.execute(payload);

        expect(subscriptionRepository.updateStatus).not.toHaveBeenCalled();
    });

    it("deve ignorar outros eventos", async () => {
        const payload = {
            event: "billing.created",
            data: { id: "billing-123" }
        };

        await sut.execute(payload);

        expect(subscriptionRepository.findByBillingId).not.toHaveBeenCalled();
    });
});
