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
    let companyRepository: any;
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

        companyRepository = {
            findByOwnerId: vi.fn().mockResolvedValue([])
        };

        notificationService = {
            notifyPaymentSuccess: vi.fn(),
            notifySubscriptionExpired: vi.fn(),
            notifySubscriptionRefunded: vi.fn(),
            notifyTrialStarted: vi.fn()
        };

        fiscalService = {
            emitirNfseAssinatura: vi.fn().mockResolvedValue({ emitted: true, codLote: 'L1', numeroNfse: '123' }),
        };

        auditLogRepository = {
            save: vi.fn(),
            create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
            update: vi.fn(),
            markProcessed: vi.fn()
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
            companyRepository,
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

    it("deve iniciar trial e enviar notificação específica de trial", async () => {
        const payload = {
            event: "subscription.trial_started",
            data: { id: "billing-456", trialDays: 7 }
        };

        const mockSubscription = { id: "sub-2", userId: "user-2", plan: "PRO" };
        vi.mocked(subscriptionRepository.findByBillingId).mockResolvedValueOnce(mockSubscription as any);
        userRepository.findById.mockResolvedValueOnce({ id: "user-2", name: "Trial User", email: "trial@test.com" });

        const result = await sut.execute(payload);

        expect(subscriptionRepository.updateStatus).toHaveBeenCalledWith(
            "sub-2",
            "user-2",
            SubscriptionStatus.TRIAL,
            expect.any(Date),
            "PRO"
        );
        expect(notificationService.notifyTrialStarted).toHaveBeenCalledWith(
            "trial@test.com",
            "Trial User",
            "PRO",
            7
        );
        expect(notificationService.notifyPaymentSuccess).not.toHaveBeenCalled();
        expect(result.status).toBe("processed");
    });

    it("deve emitir NFS-e usando o taxId da config da empresa do owner", async () => {
        const payload = {
            event: "subscription.completed",
            data: { id: "billing-789", paidAmount: 4990 }
        };

        const mockSubscription = { id: "sub-3", userId: "user-3", plan: "PRO" };
        vi.mocked(subscriptionRepository.findByBillingId).mockResolvedValueOnce(mockSubscription as any);
        paymentRepository.findByBillingId.mockResolvedValueOnce({ id: "pay-3" });
        userRepository.findById.mockResolvedValueOnce({ id: "user-3", name: "Owner", email: "owner@test.com" });
        companyRepository.findByOwnerId.mockResolvedValueOnce([{ id: "comp-1", ownerId: "user-3" }]);
        companyConfigRepository.findByCompanyId.mockImplementation(async (companyId: string) =>
            companyId === "comp-1" ? { companyId: "comp-1", taxId: "12345678900", address: "Rua A" } : null
        );

        await sut.execute(payload);

        expect(companyRepository.findByOwnerId).toHaveBeenCalledWith("user-3");
        expect(fiscalService.emitirNfseAssinatura).toHaveBeenCalledWith(
            expect.objectContaining({
                referenceId: "billing-789",
                tomadorCpfCnpj: "12345678900",
                tomadorNome: "Owner",
                valorServicos: 49.90
            })
        );
        expect(notificationService.notifyPaymentSuccess).toHaveBeenCalledWith("owner@test.com", "Owner", "PRO", true);
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
