import { describe, it, expect, vi, beforeEach } from "vitest";
import { CheckExpiredSubscriptionsUseCase } from "../check-expired-subscriptions.usecase";
import { SubscriptionStatus } from "../../../infra/database/entities/subscription.entity";

describe("CheckExpiredSubscriptionsUseCase", () => {
    let sut: CheckExpiredSubscriptionsUseCase;
    let subscriptionRepository: any;
    let userRepository: any;
    let notificationService: any;

    beforeEach(() => {
        subscriptionRepository = {
            findExpired: vi.fn(),
            updateStatus: vi.fn()
        };

        userRepository = {
            findById: vi.fn()
        };

        notificationService = {
            notifySubscriptionExpired: vi.fn()
        };

        sut = new CheckExpiredSubscriptionsUseCase(
            subscriptionRepository,
            userRepository,
            notificationService
        );
    });

    it("deve marcar trial expirado como CANCELLED e notificar", async () => {
        const expiredTrial = {
            id: "sub-1",
            userId: "user-1",
            status: SubscriptionStatus.TRIAL,
            plan: "PRO",
            currentPeriodEnd: new Date("2025-01-01")
        };

        subscriptionRepository.findExpired.mockResolvedValueOnce([expiredTrial]);
        userRepository.findById.mockResolvedValueOnce({ id: "user-1", name: "Felipe", email: "felipe@test.com" });

        const result = await sut.execute();

        expect(subscriptionRepository.updateStatus).toHaveBeenCalledWith(
            "sub-1", "user-1", SubscriptionStatus.CANCELLED
        );
        expect(notificationService.notifySubscriptionExpired).toHaveBeenCalledWith("felipe@test.com", "Felipe");
        expect(result.processed).toBe(1);
    });

    it("deve marcar assinatura paga expirada como PAST_DUE", async () => {
        const expiredActive = {
            id: "sub-2",
            userId: "user-2",
            status: SubscriptionStatus.ACTIVE,
            plan: "PRO",
            currentPeriodEnd: new Date("2025-01-01")
        };

        subscriptionRepository.findExpired.mockResolvedValueOnce([expiredActive]);
        userRepository.findById.mockResolvedValueOnce({ id: "user-2", name: "Ana", email: "ana@test.com" });

        const result = await sut.execute();

        expect(subscriptionRepository.updateStatus).toHaveBeenCalledWith(
            "sub-2", "user-2", SubscriptionStatus.PAST_DUE
        );
        expect(result.processed).toBe(1);
    });

    it("deve processar zero quando nao houver expirados", async () => {
        subscriptionRepository.findExpired.mockResolvedValueOnce([]);

        const result = await sut.execute();

        expect(subscriptionRepository.updateStatus).not.toHaveBeenCalled();
        expect(result.processed).toBe(0);
    });

    it("deve continuar processando mesmo se o usuario nao for encontrado", async () => {
        const expiredTrial = {
            id: "sub-3",
            userId: "user-ghost",
            status: SubscriptionStatus.TRIAL,
            plan: "PRO",
            currentPeriodEnd: new Date("2025-01-01")
        };

        subscriptionRepository.findExpired.mockResolvedValueOnce([expiredTrial]);
        userRepository.findById.mockResolvedValueOnce(null);

        const result = await sut.execute();

        expect(subscriptionRepository.updateStatus).toHaveBeenCalledWith(
            "sub-3", "user-ghost", SubscriptionStatus.CANCELLED
        );
        expect(notificationService.notifySubscriptionExpired).not.toHaveBeenCalled();
        expect(result.processed).toBe(1);
    });
});
