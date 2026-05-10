import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExchangeGoogleCodeUseCase } from "../exchange-google-code.usecase";
import { IGoogleCalendarService } from "../../ports/igoogle-calendar-service";
import { ICompanyConfigRepository } from "../../repositories/icompany-config-repository";
import { IIntegrationRepository } from "../../repositories/iintegration-repository";

describe("ExchangeGoogleCodeUseCase", () => {
    let sut: ExchangeGoogleCodeUseCase;
    let googleService: IGoogleCalendarService;
    let companyConfigRepository: ICompanyConfigRepository;
    let integrationRepository: IIntegrationRepository;

    beforeEach(() => {
        googleService = {
            getAuthUrl: vi.fn(),
            getTokens: vi.fn().mockResolvedValue({
                access_token: "access-123",
                refresh_token: "refresh-123",
                expires_in: 3600
            }),
            refreshAccessToken: vi.fn(),
            listEvents: vi.fn(),
            updateEvent: vi.fn(),
            getUserProfile: vi.fn()
        };

        companyConfigRepository = {
            findByCompanyId: vi.fn().mockResolvedValue({ syncEnabled: false }),
            save: vi.fn(),
            updateByCompanyId: vi.fn(),
            findByInstanceName: vi.fn(),
            findByWhatsappNumber: vi.fn(),
            findByLastMessageId: vi.fn(),
            findAllActive: vi.fn()
        } as any;

        integrationRepository = {
            findByCompanyAndProvider: vi.fn().mockResolvedValue(null),
            save: vi.fn()
        } as any;

        sut = new ExchangeGoogleCodeUseCase(googleService, companyConfigRepository, integrationRepository);
    });

    it("deve criar uma nova integração se não existir para a empresa", async () => {
        vi.mocked(integrationRepository.findByCompanyAndProvider).mockResolvedValueOnce(null);

        await sut.execute("company-1", {
            access_token: "access-123",
            refresh_token: "refresh-123",
            expires_in: 3600
        });

        expect(integrationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            companyId: "company-1",
            accessToken: "access-123",
            refreshToken: "refresh-123"
        }));
    });

    it("deve atualizar integração existente e manter o refresh token antigo se o novo for nulo", async () => {
        const existing = {
            companyId: "company-1",
            provider: "GOOGLE",
            refreshToken: "old-refresh",
            accessToken: "old-access"
        };

        vi.mocked(integrationRepository.findByCompanyAndProvider).mockResolvedValueOnce(existing as any);
        await sut.execute("company-1", {
            access_token: "new-access",
            expires_in: 3600
            // sem refresh_token
        });

        expect(integrationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            accessToken: "new-access",
            refreshToken: "old-refresh"
        }));
    });

    it("deve salvar a data de expiração correta", async () => {
        vi.mocked(integrationRepository.findByCompanyAndProvider).mockResolvedValueOnce(null);
        
        const now = Date.now();
        vi.useFakeTimers();
        vi.setSystemTime(now);

        await sut.execute("company-1", {
            access_token: "access-123",
            expires_in: 3600
        });

        const expectedExpiry = new Date(now + 3600 * 1000);
        
        expect(integrationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            expiresAt: expectedExpiry
        }));

        vi.useRealTimers();
    });

    it("deve habilitar sync na company config", async () => {
        const config = { syncEnabled: false };
        vi.mocked(companyConfigRepository.findByCompanyId).mockResolvedValueOnce(config as any);
        vi.mocked(integrationRepository.findByCompanyAndProvider).mockResolvedValueOnce(null);

        await sut.execute("company-1", {
            access_token: "access-123",
            expires_in: 3600
        });

        expect(companyConfigRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            syncEnabled: true
        }));
    });
});
