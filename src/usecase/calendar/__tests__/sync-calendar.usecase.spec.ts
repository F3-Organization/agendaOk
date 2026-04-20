import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyncCalendarUseCase } from "../sync-calendar.usecase";
import { IGoogleCalendarService } from "../../ports/igoogle-calendar-service";
import { IScheduleRepository } from "../../repositories/ischedule-repository";
import { ICompanyConfigRepository } from "../../repositories/icompany-config-repository";
import { IUserRepository } from "../../repositories/iuser-repository";
import { IIntegrationRepository } from "../../repositories/iintegration-repository";
import { IEvolutionService } from "../../ports/ievolution-service";
import { CheckUsageLimitUseCase } from "../../subscription/check-usage-limit.usecase";
import { CompanyConfig } from "../../../infra/database/entities/company-config.entity";
import { ScheduleStatus } from "../../../infra/database/entities/schedule.entity";

describe("SyncCalendarUseCase", () => {
    let sut: SyncCalendarUseCase;
    let googleService: IGoogleCalendarService;
    let scheduleRepository: IScheduleRepository;
    let companyConfigRepository: ICompanyConfigRepository;
    let userRepository: IUserRepository;
    let integrationRepository: IIntegrationRepository;
    let evolutionService: IEvolutionService;
    let checkUsageLimit: CheckUsageLimitUseCase;

    const mockConfig = {
        id: "1",
        companyId: "company-1",
        syncEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
    } as CompanyConfig;

    const mockIntegration = {
        id: "int-1",
        companyId: "company-1",
        provider: "GOOGLE",
        accessToken: "old-token",
        refreshToken: "refresh-token",
        expiresAt: new Date(Date.now() + 3600000)
    };

    beforeEach(() => {
        googleService = {
            getAuthUrl: vi.fn(),
            getTokens: vi.fn(),
            refreshAccessToken: vi.fn(),
            listEvents: vi.fn().mockResolvedValue([]),
            updateEvent: vi.fn(),
            getUserProfile: vi.fn()
        };

        scheduleRepository = {
            save: vi.fn(),
            findByGoogleEventId: vi.fn(),
            findByCompanyId: vi.fn(),
            findNextToNotify: vi.fn(),
            updateStatus: vi.fn(),
            updateNotified: vi.fn()
        };

        companyConfigRepository = {
            findByCompanyId: vi.fn().mockResolvedValue(mockConfig),
            findByInstanceName: vi.fn(),
            findAllActive: vi.fn(),
            save: vi.fn(),
            updateByCompanyId: vi.fn()
        };

        userRepository = {
            findById: vi.fn().mockResolvedValue({ id: "user-1", name: "Test User", email: "test@test.com" }),
            findByEmail: vi.fn(),
            save: vi.fn()
        } as any;

        integrationRepository = {
            findByCompanyAndProvider: vi.fn().mockResolvedValue(mockIntegration),
            save: vi.fn()
        } as any;

        evolutionService = {
            sendText: vi.fn(),
            createInstance: vi.fn(),
            connectInstance: vi.fn(),
            setWebhook: vi.fn(),
            logoutInstance: vi.fn(),
            deleteInstance: vi.fn()
        };

        checkUsageLimit = {
            execute: vi.fn().mockResolvedValue({ canSend: true, plan: "FREE", count: 0 })
        } as any;

        sut = new SyncCalendarUseCase(
            googleService,
            scheduleRepository,
            companyConfigRepository,
            userRepository,
            integrationRepository,
            evolutionService,
            checkUsageLimit
        );
    });

    it("deve encerrar se a sincronização estiver desabilitada", async () => {
        vi.mocked(companyConfigRepository.findByCompanyId).mockResolvedValueOnce({
            ...mockConfig,
            syncEnabled: false
        } as CompanyConfig);

        await sut.execute("company-1");

        expect(googleService.listEvents).not.toHaveBeenCalled();
    });

    it("deve renovar o access token se estiver expirado", async () => {
        const expiredIntegration = {
            ...mockIntegration,
            expiresAt: new Date(Date.now() - 1000)
        };
        vi.mocked(integrationRepository.findByCompanyAndProvider).mockResolvedValueOnce(expiredIntegration as any);
        vi.mocked(googleService.refreshAccessToken).mockResolvedValueOnce({
            access_token: "new-token",
            expires_in: 3600
        });

        await sut.execute("company-1");

        expect(googleService.refreshAccessToken).toHaveBeenCalledWith("refresh-token");
    });

    it("deve lançar erro se falhar ao renovar o access token", async () => {
        const expiredIntegration = {
            ...mockIntegration,
            expiresAt: new Date(Date.now() - 1000)
        };
        vi.mocked(integrationRepository.findByCompanyAndProvider).mockResolvedValueOnce(expiredIntegration as any);
        vi.mocked(googleService.refreshAccessToken).mockResolvedValueOnce({
            access_token: undefined
        });

        await expect(sut.execute("company-1")).rejects.toThrow("Failed to refresh Google access token");
    });

    it("deve criar novos agendamentos para eventos inexistentes", async () => {
        const mockEvent = {
            id: "event-123",
            summary: "Corte de Cabelo",
            start: { dateTime: "2026-03-28T10:00:00Z" },
            end: { dateTime: "2026-03-28T11:00:00Z" }
        };

        vi.mocked(googleService.listEvents).mockResolvedValueOnce([mockEvent]);
        vi.mocked(scheduleRepository.findByGoogleEventId).mockResolvedValueOnce(null);

        await sut.execute("company-1");

        expect(scheduleRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            googleEventId: "event-123",
            title: "Corte de Cabelo",
            status: ScheduleStatus.PENDING
        }));
    });

    it("deve atualizar agendamentos existentes se o evento já estiver no banco", async () => {
        const mockEvent = {
            id: "event-123",
            summary: "Corte Atualizado",
            start: { dateTime: "2026-03-28T10:00:00Z" },
            end: { dateTime: "2026-03-28T11:00:00Z" }
        };

        const existingSchedule = {
            id: "uuid-1",
            googleEventId: "event-123",
            title: "Corte Antigo"
        } as any;

        vi.mocked(googleService.listEvents).mockResolvedValueOnce([mockEvent]);
        vi.mocked(scheduleRepository.findByGoogleEventId).mockResolvedValueOnce(existingSchedule);

        await sut.execute("company-1");

        expect(scheduleRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            id: "uuid-1",
            title: "Corte Atualizado"
        }));
    });
});
