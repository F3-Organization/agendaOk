import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateSubscriptionCheckoutUseCase } from "../create-checkout.usecase";
import { UserRepository } from "../../../infra/database/repositories/user.repository";
import { SubscriptionRepository } from "../../../infra/database/repositories/subscription.repository";
import { CompanyConfigRepository } from "../../../infra/database/repositories/company-config.repository";
import { IPaymentGateway } from "../../ports/ipayment-gateway";
import { ISubscriptionPaymentRepository } from "../../repositories/isubscription-payment-repository";
import { SubscriptionStatus } from "../../../infra/database/entities/subscription.entity";

describe("CreateSubscriptionCheckoutUseCase", () => {
    let sut: CreateSubscriptionCheckoutUseCase;
    let userRepository: UserRepository;
    let subscriptionRepository: SubscriptionRepository;
    let companyConfigRepository: CompanyConfigRepository;
    let paymentGateway: IPaymentGateway;
    let paymentRepository: ISubscriptionPaymentRepository;

    beforeEach(() => {
        userRepository = {
            findById: vi.fn(),
            save: vi.fn(),
            findByEmail: vi.fn()
        } as any;

        subscriptionRepository = {
            findByCompanyId: vi.fn(),
            createOrUpdate: vi.fn(),
            save: vi.fn()
        } as any;

        companyConfigRepository = {
            findByCompanyId: vi.fn(),
            updateByCompanyId: vi.fn()
        } as any;

        paymentGateway = {
            createCustomer: vi.fn(),
            getCustomer: vi.fn(),
            createSubscription: vi.fn(),
            createBilling: vi.fn(),
            getBilling: vi.fn()
        } as any;

        paymentRepository = {
            findPendingByUser: vi.fn(),
            create: vi.fn(),
            findByBillingId: vi.fn(),
            findById: vi.fn(),
            update: vi.fn()
        } as any;

        sut = new CreateSubscriptionCheckoutUseCase(
            userRepository,
            subscriptionRepository,
            companyConfigRepository,
            paymentGateway,
            paymentRepository
        );
    });

    it("deve lançar erro se o usuário não for encontrado", async () => {
        vi.mocked(userRepository.findById).mockResolvedValueOnce(null);

        await expect(sut.execute("company-1")).rejects.toThrow("User not found");
    });

    it("deve retornar URL existente se a assinatura já estiver ativa", async () => {
        vi.mocked(userRepository.findById).mockResolvedValueOnce({ id: "user-1" } as any);
        vi.mocked(subscriptionRepository.findByCompanyId).mockResolvedValueOnce({
            status: SubscriptionStatus.ACTIVE,
            checkoutUrl: "https://checkout.url"
        } as any);

        const result = await sut.execute("company-1");

        expect(result.url).toBe("https://checkout.url");
        expect(paymentGateway.createCustomer).not.toHaveBeenCalled();
    });

    it("deve criar novo customer se não existir um customerId", async () => {
        vi.mocked(userRepository.findById).mockResolvedValueOnce({ id: "user-1", name: "User", email: "user@test.com" } as any);
        vi.mocked(subscriptionRepository.findByCompanyId).mockResolvedValueOnce(null);
        vi.mocked(companyConfigRepository.findByCompanyId).mockResolvedValueOnce({
            whatsappNumber: "5511999999999",
            taxId: "123.456.789-00"
        } as any);
        vi.mocked(paymentGateway.createCustomer).mockResolvedValueOnce({ id: "customer-123" });
        (paymentGateway as any).createSubscription.mockResolvedValueOnce({ id: "billing-123", url: "https://new-checkout.url" });
        (paymentGateway as any).getCustomer.mockResolvedValueOnce(null);
        vi.mocked(subscriptionRepository.save).mockResolvedValueOnce({ id: "sub-1" } as any);

        const result = await sut.execute("company-1");

        expect(paymentGateway.createCustomer).toHaveBeenCalledWith(expect.objectContaining({
            name: "User",
            email: "user@test.com"
        }));
        expect(result.url).toBe("https://new-checkout.url");
    });

    it("deve usar o customerId existente se disponível", async () => {
        vi.mocked(userRepository.findById).mockResolvedValueOnce({ id: "user-1" } as any);
        vi.mocked(subscriptionRepository.findByCompanyId).mockResolvedValueOnce({
            id: "sub-1",
            abacateCustomerId: "customer-existente",
            status: SubscriptionStatus.INACTIVE
        } as any);
        (paymentRepository as any).findPendingByUser.mockResolvedValueOnce({
            checkoutUrl: "https://pending-checkout.url"
        });

        const result = await sut.execute("company-1");

        expect(result.url).toBe("https://pending-checkout.url");
    });
});
