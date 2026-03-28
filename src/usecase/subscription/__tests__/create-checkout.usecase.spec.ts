import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateSubscriptionCheckoutUseCase } from "../create-checkout.usecase";
import { UserRepository } from "../../../infra/database/repositories/user.repository";
import { SubscriptionRepository } from "../../../infra/database/repositories/subscription.repository";
import { IPaymentGateway } from "../../ports/ipayment-gateway";
import { SubscriptionStatus } from "../../../infra/database/entities/subscription.entity";

describe("CreateSubscriptionCheckoutUseCase", () => {
    let sut: CreateSubscriptionCheckoutUseCase;
    let userRepository: UserRepository;
    let subscriptionRepository: SubscriptionRepository;
    let paymentGateway: IPaymentGateway;

    beforeEach(() => {
        userRepository = {
            findById: vi.fn(),
            save: vi.fn(),
            findByEmail: vi.fn()
        } as any;

        subscriptionRepository = {
            findByUserId: vi.fn(),
            createOrUpdate: vi.fn()
        } as any;

        paymentGateway = {
            createCustomer: vi.fn(),
            createBilling: vi.fn(),
            getBilling: vi.fn()
        };

        sut = new CreateSubscriptionCheckoutUseCase(
            userRepository,
            subscriptionRepository,
            paymentGateway
        );
    });

    it("deve lançar erro se o usuário não for encontrado", async () => {
        vi.mocked(userRepository.findById).mockResolvedValueOnce(null);

        await expect(sut.execute("user-1")).rejects.toThrow("User not found");
    });

    it("deve retornar URL existente se a assinatura já estiver ativa", async () => {
        vi.mocked(userRepository.findById).mockResolvedValueOnce({ id: "user-1" } as any);
        vi.mocked(subscriptionRepository.findByUserId).mockResolvedValueOnce({
            status: SubscriptionStatus.ACTIVE,
            checkoutUrl: "https://checkout.url"
        } as any);

        const result = await sut.execute("user-1");

        expect(result.url).toBe("https://checkout.url");
        expect(paymentGateway.createCustomer).not.toHaveBeenCalled();
    });

    it("deve criar novo customer se não existir um customerId", async () => {
        vi.mocked(userRepository.findById).mockResolvedValueOnce({ id: "user-1", name: "User", email: "user@test.com" } as any);
        vi.mocked(subscriptionRepository.findByUserId).mockResolvedValueOnce(null);
        vi.mocked(paymentGateway.createCustomer).mockResolvedValueOnce({ id: "customer-123" });
        vi.mocked(paymentGateway.createBilling).mockResolvedValueOnce({ id: "billing-123", url: "https://new-checkout.url" });

        const result = await sut.execute("user-1");

        expect(paymentGateway.createCustomer).toHaveBeenCalledWith(expect.objectContaining({
            name: "User",
            email: "user@test.com"
        }));
        expect(subscriptionRepository.createOrUpdate).toHaveBeenCalledWith("user-1", expect.objectContaining({
            abacateCustomerId: "customer-123",
            checkoutUrl: "https://new-checkout.url"
        }));
        expect(result.url).toBe("https://new-checkout.url");
    });

    it("deve usar o customerId existente se disponível", async () => {
        vi.mocked(userRepository.findById).mockResolvedValueOnce({ id: "user-1" } as any);
        vi.mocked(subscriptionRepository.findByUserId).mockResolvedValueOnce({
            abacateCustomerId: "customer-existente",
            status: SubscriptionStatus.INACTIVE
        } as any);
        vi.mocked(paymentGateway.createBilling).mockResolvedValueOnce({ id: "billing-123", url: "https://checkout.url" });

        await sut.execute("user-1");

        expect(paymentGateway.createCustomer).not.toHaveBeenCalled();
        expect(paymentGateway.createBilling).toHaveBeenCalledWith(expect.objectContaining({
            customerId: "customer-existente"
        }));
    });
});
