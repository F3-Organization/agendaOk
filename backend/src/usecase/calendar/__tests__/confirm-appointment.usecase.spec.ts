import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConfirmAppointmentUseCase } from "../confirm-appointment.usecase";
import { IGoogleCalendarService } from "../../ports/igoogle-calendar-service";
import { IScheduleRepository } from "../../repositories/ischedule-repository";
import { ICompanyConfigRepository } from "../../repositories/icompany-config-repository";
import { IIntegrationRepository } from "../../repositories/iintegration-repository";
import { CompanyConfig } from "../../../infra/database/entities/company-config.entity";
import { Schedule, ScheduleStatus } from "../../../infra/database/entities/schedule.entity";

describe("ConfirmAppointmentUseCase", () => {
    let sut: ConfirmAppointmentUseCase;
    let googleService: IGoogleCalendarService;
    let scheduleRepository: IScheduleRepository;
    let companyConfigRepository: ICompanyConfigRepository;
    let integrationRepository: IIntegrationRepository;

    const mockConfig = {
        companyId: "user-1"
    } as CompanyConfig;

    beforeEach(() => {
        googleService = {
            getAuthUrl: vi.fn(),
            getTokens: vi.fn(),
            refreshAccessToken: vi.fn(),
            listEvents: vi.fn(),
            updateEvent: vi.fn(),
            getUserProfile: vi.fn()
        };

        scheduleRepository = {
            save: vi.fn(),
            findByGoogleEventId: vi.fn(),
            findByCompanyId: vi.fn(),
            findNextToNotify: vi.fn().mockResolvedValue([]),
            updateStatus: vi.fn(),
            updateNotified: vi.fn()
        };

        companyConfigRepository = {
            findByCompanyId: vi.fn().mockResolvedValue(mockConfig),
            findByInstanceName: vi.fn(),
            save: vi.fn(),
            update: vi.fn(),
            findAllActive: vi.fn()
        };

        integrationRepository = {
            findByCompanyAndProvider: vi.fn().mockResolvedValue({ accessToken: "token-123", refreshToken: "refresh-token" }),
            save: vi.fn()
        } as any;

        sut = new ConfirmAppointmentUseCase(
            scheduleRepository,
            companyConfigRepository,
            integrationRepository,
            googleService
        );
    });

    it("deve confirmar o agendamento no banco e no Google se o telefone coincidir", async () => {
        const appointment = {
            id: "schedule-123",
            googleEventId: "google-123",
            title: "Corte João (11) 98888-7777",
            status: ScheduleStatus.PENDING
        } as Schedule;

        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([appointment]);

        await sut.execute("user-1", "5511988887777");

        expect(scheduleRepository.updateStatus).toHaveBeenCalledWith("schedule-123", "user-1", ScheduleStatus.CONFIRMED);
        expect(googleService.updateEvent).toHaveBeenCalledWith(
            "token-123",
            "google-123",
            expect.objectContaining({ summary: "✅ Corte João (11) 98888-7777" })
        );
    });

    it("não deve confirmar se o telefone for diferente", async () => {
        const appointment = {
            id: "schedule-123",
            title: "Corte João (11) 98888-7777",
            status: ScheduleStatus.PENDING
        } as Schedule;

        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([appointment]);

        await sut.execute("user-1", "5511000000000");

        expect(scheduleRepository.updateStatus).not.toHaveBeenCalled();
        expect(googleService.updateEvent).not.toHaveBeenCalled();
    });

    it("deve evitar duplicar o emoji ✅ no título do Google", async () => {
        const appointment = {
            id: "schedule-123",
            googleEventId: "google-123",
            title: "✅ Corte João (11) 98888-7777",
            status: ScheduleStatus.PENDING
        } as Schedule;

        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([appointment]);

        await sut.execute("user-1", "5511988887777");

        expect(googleService.updateEvent).toHaveBeenCalledWith(
            "token-123",
            "google-123",
            expect.objectContaining({ summary: "✅ Corte João (11) 98888-7777" })
        );
    });

    it("deve logar erro no console se falhar a atualização no Google Calendar", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const appointment = {
            id: "schedule-123",
            googleEventId: "google-123",
            title: "Corte João (11) 98888-7777",
            status: ScheduleStatus.PENDING
        } as Schedule;

        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([appointment]);
        vi.mocked(googleService.updateEvent).mockRejectedValueOnce(new Error("Google Error"));

        await sut.execute("user-1", "5511988887777");

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to update Google Calendar"), expect.any(Error));
        consoleSpy.mockRestore();
    });

    it("não deve tentar atualizar Google se o usuário não tiver token ou configuração", async () => {
        vi.mocked(integrationRepository.findByCompanyAndProvider).mockResolvedValueOnce(null);
        
        const appointment = {
            id: "schedule-123",
            googleEventId: "google-123",
            title: "Corte João (11) 98888-7777",
            status: ScheduleStatus.PENDING
        } as Schedule;

        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([appointment]);

        await sut.execute("user-1", "5511988887777");

        expect(googleService.updateEvent).not.toHaveBeenCalled();
    });

    it("não deve retornar telefone se o texto não contiver um padrão válido", async () => {
        const appointment = {
            id: "schedule-123",
            title: "Corte sem telefone",
            status: ScheduleStatus.PENDING
        } as Schedule;

        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([appointment]);

        await sut.execute("user-1", "5511988887777");

        expect(scheduleRepository.updateStatus).not.toHaveBeenCalled();
    });
});
