import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotifyUpcomingAppointmentsUseCase } from "../../appointment/notify-upcoming-appointments.usecase";
import { CompanyConfig } from "../../../infra/database/entities/company-config.entity";
import { Schedule } from "../../../infra/database/entities/schedule.entity";

const TWO_HOURS = 2 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

describe("NotifyUpcomingAppointmentsUseCase", () => {
    let sut: NotifyUpcomingAppointmentsUseCase;
    let scheduleRepository: any;
    let companyConfigRepository: any;
    let evolutionService: any;
    let silentWindow: any;
    let checkUsageLimit: any;

    const mockConfig = {
        companyId: "company-1",
        whatsappInstanceName: "instancia-1",
        whatsappNumber: "5511900000000",
    } as CompanyConfig;

    const makeSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
        id: "sched-1",
        companyId: "company-1",
        title: "Corte de cabelo",
        clientName: "João",
        clientPhone: "11988887777",
        startAt: new Date("2026-06-12T18:00:00"),
        isNotified: false,
        ...overrides,
    } as Schedule);

    beforeEach(() => {
        scheduleRepository = {
            findUpcomingForNotification: vi.fn().mockResolvedValue([]),
            update: vi.fn(),
        };

        companyConfigRepository = {
            findAllActive: vi.fn().mockResolvedValue([mockConfig]),
        };

        evolutionService = {
            sendText: vi.fn(),
        };

        silentWindow = {
            isSilent: vi.fn().mockReturnValue(false),
        };

        checkUsageLimit = {
            execute: vi.fn().mockResolvedValue({ canSend: true, plan: "PRO", count: 0, limit: -1 }),
        };

        sut = new NotifyUpcomingAppointmentsUseCase(
            scheduleRepository,
            companyConfigRepository,
            evolutionService,
            silentWindow,
            checkUsageLimit
        );
    });

    it("envia lembrete e marca o agendamento como notificado", async () => {
        scheduleRepository.findUpcomingForNotification.mockResolvedValueOnce([makeSchedule()]);

        await sut.execute();

        expect(evolutionService.sendText).toHaveBeenCalledWith(
            "instancia-1",
            "5511988887777",
            expect.stringContaining("João")
        );
        expect(scheduleRepository.update).toHaveBeenCalledWith("sched-1", { isNotified: true });
    });

    it("busca agendamentos na janela entre 2h e 24h a partir de agora", async () => {
        const before = Date.now();
        await sut.execute();
        const after = Date.now();

        const [companyId, from, to] = scheduleRepository.findUpcomingForNotification.mock.calls[0];
        expect(companyId).toBe("company-1");
        expect(from.getTime()).toBeGreaterThanOrEqual(before + TWO_HOURS);
        expect(from.getTime()).toBeLessThanOrEqual(after + TWO_HOURS);
        expect(to.getTime()).toBeGreaterThanOrEqual(before + TWENTY_FOUR_HOURS);
        expect(to.getTime()).toBeLessThanOrEqual(after + TWENTY_FOUR_HOURS);
    });

    it("não envia nada para empresa dentro da janela de silêncio", async () => {
        silentWindow.isSilent.mockReturnValueOnce(true);
        scheduleRepository.findUpcomingForNotification.mockResolvedValueOnce([makeSchedule()]);

        await sut.execute();

        expect(evolutionService.sendText).not.toHaveBeenCalled();
        expect(scheduleRepository.update).not.toHaveBeenCalled();
    });

    it("não envia quando o limite do plano foi atingido", async () => {
        checkUsageLimit.execute.mockResolvedValueOnce({ canSend: false, plan: "FREE", count: 50, limit: 50 });
        scheduleRepository.findUpcomingForNotification.mockResolvedValueOnce([makeSchedule()]);

        await sut.execute();

        expect(evolutionService.sendText).not.toHaveBeenCalled();
    });

    it("envia apenas até o restante da cota quando há mais agendamentos que quota", async () => {
        checkUsageLimit.execute.mockResolvedValueOnce({ canSend: true, plan: "FREE", count: 49, limit: 50 });
        scheduleRepository.findUpcomingForNotification.mockResolvedValueOnce([
            makeSchedule({ id: "sched-1" }),
            makeSchedule({ id: "sched-2", clientPhone: "11977776666" }),
        ]);

        await sut.execute();

        expect(evolutionService.sendText).toHaveBeenCalledTimes(1);
        expect(scheduleRepository.update).toHaveBeenCalledWith("sched-1", { isNotified: true });
    });

    it("continua o loop se um envio falhar", async () => {
        scheduleRepository.findUpcomingForNotification.mockResolvedValueOnce([
            makeSchedule({ id: "sched-1" }),
            makeSchedule({ id: "sched-2", clientPhone: "11977776666" }),
        ]);
        evolutionService.sendText.mockRejectedValueOnce(new Error("API Down"));

        await sut.execute();

        expect(evolutionService.sendText).toHaveBeenCalledTimes(2);
        expect(scheduleRepository.update).toHaveBeenCalledTimes(1);
        expect(scheduleRepository.update).toHaveBeenCalledWith("sched-2", { isNotified: true });
    });

    it("ignora empresas sem instância WhatsApp configurada", async () => {
        companyConfigRepository.findAllActive.mockResolvedValueOnce([
            { companyId: "company-2", whatsappInstanceName: undefined } as CompanyConfig,
        ]);

        await sut.execute();

        expect(scheduleRepository.findUpcomingForNotification).not.toHaveBeenCalled();
    });
});
