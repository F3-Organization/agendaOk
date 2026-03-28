import { describe, it, expect, vi, beforeEach } from "vitest";
import { CancelAppointmentUseCase } from "../cancel-appointment.usecase";
import { IGoogleCalendarService } from "../../ports/igoogle-calendar-service";
import { IScheduleRepository } from "../../repositories/ischedule-repository";
import { IUserConfigRepository } from "../../repositories/iuser-config-repository";
import { ScheduleStatus } from "../../../infra/database/entities/schedule.entity";

describe("CancelAppointmentUseCase", () => {
    let sut: CancelAppointmentUseCase;
    let scheduleRepository: IScheduleRepository;
    let userConfigRepository: IUserConfigRepository;
    let googleService: IGoogleCalendarService;

    beforeEach(() => {
        scheduleRepository = {
            findNextToNotify: vi.fn().mockResolvedValue([]),
            updateStatus: vi.fn(),
            updateNotified: vi.fn(),
            save: vi.fn(),
            findByGoogleEventId: vi.fn(),
            findByUserId: vi.fn()
        };

        userConfigRepository = {
            findByUserId: vi.fn().mockResolvedValue({
                googleAccessToken: "valid-token"
            }),
            findByInstanceName: vi.fn(),
            findAllActive: vi.fn(),
            save: vi.fn(),
            update: vi.fn()
        };

        googleService = {
            updateEvent: vi.fn().mockResolvedValue({}),
            getAuthUrl: vi.fn(),
            getTokens: vi.fn(),
            refreshAccessToken: vi.fn(),
            listEvents: vi.fn(),
            getUserProfile: vi.fn()
        };

        sut = new CancelAppointmentUseCase(scheduleRepository, userConfigRepository, googleService);
    });

    it("deve cancelar o agendamento se o número de telefone coincidir", async () => {
        const mockSchedule = {
            id: "1",
            title: "Corte de Cabelo (11) 99999-9999",
            googleEventId: "google-1",
            status: ScheduleStatus.PENDING
        };

        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([mockSchedule as any]);

        await sut.execute("user-1", "5511999999999");

        expect(scheduleRepository.updateStatus).toHaveBeenCalledWith("1", ScheduleStatus.CANCELLED);
        expect(googleService.updateEvent).toHaveBeenCalledWith("valid-token", "google-1", expect.objectContaining({
            summary: expect.stringContaining("❌")
        }));
    });

    it("não deve cancelar se o número não coincidir", async () => {
        const mockSchedule = {
            id: "1",
            title: "Outro Título (11) 88888-8888",
            googleEventId: "google-1"
        };

        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([mockSchedule as any]);

        await sut.execute("user-1", "5511999999999");

        expect(scheduleRepository.updateStatus).not.toHaveBeenCalled();
    });

    it("deve logar erro no console se falhar a atualização no Google Calendar", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const mockSchedule = {
            id: "1",
            title: "Corte (11) 99999-9999",
            googleEventId: "google-1"
        };

        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([mockSchedule as any]);
        vi.mocked(googleService.updateEvent).mockRejectedValueOnce(new Error("Google Error"));

        await sut.execute("user-1", "5511999999999");

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to update Google Calendar"), expect.any(Error));
        consoleSpy.mockRestore();
    });

    it("não deve tentar atualizar Google se o usuário não tiver token", async () => {
        vi.mocked(userConfigRepository.findByUserId).mockResolvedValueOnce(null);
        
        const mockSchedule = {
            id: "1",
            title: "Corte (11) 99999-9999",
            googleEventId: "google-1"
        };
        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([mockSchedule as any]);

        await sut.execute("user-1", "5511999999999");

        expect(googleService.updateEvent).not.toHaveBeenCalled();
    });
});
