import { describe, it, expect, vi, beforeEach } from "vitest";
import { HandleAbacatePayWebhookUseCase } from "../handle-abacate-webhook.usecase";
import { SubscriptionRepository } from "../../../infra/database/repositories/subscription.repository";
import { SubscriptionStatus } from "../../../infra/database/entities/subscription.entity";

describe("HandleAbacatePayWebhookUseCase", () => {
    let sut: HandleAbacatePayWebhookUseCase;
    let subscriptionRepository: SubscriptionRepository;

    beforeEach(() => {
        subscriptionRepository = {
            findByBillingId: vi.fn(),
            updateStatus: vi.fn(),
            findByUserId: vi.fn(),
            createOrUpdate: vi.fn()
        } as any;

        sut = new HandleAbacatePayWebhookUseCase(subscriptionRepository);
    });

    it("deve ativar a assinatura quando o evento for billing.paid", async () => {
        const payload = {
            event: "billing.paid",
            data: { id: "billing-123" }
        };

        const mockSubscription = { id: "sub-1", userId: "user-1" };
        vi.mocked(subscriptionRepository.findByBillingId).mockResolvedValueOnce(mockSubscription as any);

        const result = await sut.execute(payload);

        expect(subscriptionRepository.updateStatus).toHaveBeenCalledWith(
            "sub-1",
            SubscriptionStatus.ACTIVE,
            expect.any(Date)
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
