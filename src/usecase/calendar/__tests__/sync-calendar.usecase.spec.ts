import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyncCalendarUseCase } from "../sync-calendar.usecase";
import { IGoogleCalendarService } from "../../ports/igoogle-calendar-service";
import { IScheduleRepository } from "../../repositories/ischedule-repository";
import { IUserConfigRepository } from "../../repositories/iuser-config-repository";
import { UserConfig } from "../../../infra/database/entities/user-config.entity";
import { ScheduleStatus } from "../../../infra/database/entities/schedule.entity";

describe("SyncCalendarUseCase", () => {
    let sut: SyncCalendarUseCase;
    let googleService: IGoogleCalendarService;
    let scheduleRepository: IScheduleRepository;
    let userConfigRepository: IUserConfigRepository;

    const mockUserConfig: UserConfig = {
        id: "1",
        userId: "user-1",
        syncEnabled: true,
        googleAccessToken: "old-token",
        googleRefreshToken: "refresh-token",
        googleTokenExpiry: new Date(Date.now() + 3600000), // 1h no futuro
        createdAt: new Date(),
        updatedAt: new Date()
    } as UserConfig;

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
            findByUserId: vi.fn(),
            findNextToNotify: vi.fn(),
            updateStatus: vi.fn(),
            updateNotified: vi.fn()
        };

        userConfigRepository = {
            findByUserId: vi.fn().mockResolvedValue(mockUserConfig),
            findByInstanceName: vi.fn(),
            findAllActive: vi.fn(),
            save: vi.fn(),
            update: vi.fn()
        };

        sut = new SyncCalendarUseCase(googleService, scheduleRepository, userConfigRepository);
    });

    it("deve encerrar se a sincronização estiver desabilitada", async () => {
        vi.mocked(userConfigRepository.findByUserId).mockResolvedValueOnce({
            ...mockUserConfig,
            syncEnabled: false
        } as UserConfig);

        await sut.execute("user-1");

        expect(googleService.listEvents).not.toHaveBeenCalled();
    });

    it("deve renovar o access token se estiver expirado", async () => {
        const expiredConfig = {
            ...mockUserConfig,
            googleTokenExpiry: new Date(Date.now() - 1000)
        } as UserConfig;

        vi.mocked(userConfigRepository.findByUserId).mockResolvedValueOnce(expiredConfig);
        vi.mocked(googleService.refreshAccessToken).mockResolvedValueOnce({
            access_token: "new-token",
            expires_in: 3600
        });

        await sut.execute("user-1");

        expect(googleService.refreshAccessToken).toHaveBeenCalledWith("refresh-token");
        expect(userConfigRepository.update).toHaveBeenCalledWith("user-1", expect.objectContaining({
            googleAccessToken: "new-token"
        }));
    });

    it("deve lançar erro se falhar ao renovar o access token", async () => {
        const expiredConfig = {
            ...mockUserConfig,
            googleTokenExpiry: new Date(Date.now() - 1000)
        } as UserConfig;

        vi.mocked(userConfigRepository.findByUserId).mockResolvedValueOnce(expiredConfig);
        vi.mocked(googleService.refreshAccessToken).mockResolvedValueOnce({
            access_token: undefined
        });

        await expect(sut.execute("user-1")).rejects.toThrow("Failed to refresh Google access token");
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

        await sut.execute("user-1");

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

        await sut.execute("user-1");

        expect(scheduleRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            id: "uuid-1",
            title: "Corte Atualizado"
        }));
    });
});
