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
    let fiscalService: any;
    let auditLogRepository: any;
    let paymentMethodRepository: any;
    let planRepository: any;

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

        fiscalService = {
            emitirNfseAssinatura: vi.fn().mockResolvedValue({ emitted: true, codLote: 'L1', numeroNfse: '123' }),
        };

        auditLogRepository = {
            save: vi.fn(),
            create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
            update: vi.fn()
        };

        paymentMethodRepository = {
            findByCode: vi.fn()
        };

        planRepository = {
            findBySlug: vi.fn()
        };

        sut = new HandleAbacatePayWebhookUseCase(
            subscriptionRepository,
            paymentRepository,
            userRepository,
            companyConfigRepository,
            notificationService,
            fiscalService,
            auditLogRepository,
            paymentMethodRepository,
            planRepository
        );
    });

    it("deve ativar a assinatura quando o evento for subscription.completed", async () => {
        const payload = {
            event: "subscription.completed",
            data: { id: "billing-123" }
        };

        const mockSubscription = { id: "sub-1", userId: "user-1", plan: "PRO" };
        vi.mocked(subscriptionRepository.findByBillingId).mockResolvedValueOnce(mockSubscription as any);
        paymentRepository.findByBillingId.mockResolvedValueOnce({ id: "pay-1" });
        userRepository.findById.mockResolvedValueOnce({ id: "user-1", name: "Test", email: "test@test.com" });
        companyConfigRepository.findByCompanyId.mockResolvedValueOnce(null);

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
            event: "subscription.completed",
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
