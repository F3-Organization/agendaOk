import { describe, it, expect, vi, beforeEach } from "vitest";
import { HandleEvolutionWebhookUseCase } from "../handle-evolution-webhook.usecase";
import { ICompanyConfigRepository } from "../../repositories/icompany-config-repository";
import { IScheduleRepository } from "../../repositories/ischedule-repository";
import { ConfirmAppointmentUseCase } from "../../calendar/confirm-appointment.usecase";
import { CancelAppointmentUseCase } from "../../calendar/cancel-appointment.usecase";
import { AcceptInviteUseCase } from "../../calendar/accept-invite.usecase";
import { CheckUsageLimitUseCase } from "../../subscription/check-usage-limit.usecase";
import { CompanyConfig } from "../../../infra/database/entities/company-config.entity";

describe("HandleEvolutionWebhookUseCase", () => {
    let sut: HandleEvolutionWebhookUseCase;
    let companyConfigRepository: ICompanyConfigRepository;
    let scheduleRepository: IScheduleRepository;
    let confirmAppointment: ConfirmAppointmentUseCase;
    let cancelAppointment: CancelAppointmentUseCase;
    let acceptInvite: AcceptInviteUseCase;
    let evolutionService: any;
    let checkUsageLimit: CheckUsageLimitUseCase;

    const mockConfig = {
        companyId: "company-1",
        whatsappInstanceName: "instancia-1"
    } as CompanyConfig;

    beforeEach(() => {
        companyConfigRepository = {
            findByCompanyId: vi.fn(),
            findByInstanceName: vi.fn().mockResolvedValue(mockConfig),
            save: vi.fn(),
            updateByCompanyId: vi.fn(),
            findAllActive: vi.fn(),
            findByWhatsappNumber: vi.fn(),
            findByLastMessageId: vi.fn()
        } as any;

        scheduleRepository = {
            findLastPendingInvite: vi.fn(),
            save: vi.fn(),
            findByGoogleEventId: vi.fn(),
            findByCompanyId: vi.fn(),
            findNextToNotify: vi.fn(),
            updateStatus: vi.fn(),
            updateNotified: vi.fn()
        } as any;

        confirmAppointment = {
            execute: vi.fn()
        } as any;

        cancelAppointment = {
            execute: vi.fn()
        } as any;

        acceptInvite = {
            execute: vi.fn()
        } as any;

        evolutionService = {
            sendText: vi.fn()
        };

        checkUsageLimit = {
            execute: vi.fn().mockResolvedValue({ canSend: true, plan: "FREE", count: 0 })
        } as any;

        sut = new HandleEvolutionWebhookUseCase(
            companyConfigRepository,
            scheduleRepository,
            confirmAppointment,
            cancelAppointment,
            acceptInvite,
            evolutionService,
            checkUsageLimit
        );
    });

    it("deve disparar a confirmação se a mensagem for de confirmação", async () => {
        const payload = {
            event: "messages.upsert",
            instance: "instancia-1",
            data: {
                key: { remoteJid: "5511988887777@s.whatsapp.net", fromMe: false },
                message: { conversation: "Sim, confirmado" }
            }
        };

        await sut.execute(payload);

        expect(confirmAppointment.execute).toHaveBeenCalledWith("company-1", "5511988887777");
        expect(cancelAppointment.execute).not.toHaveBeenCalled();
    });

    it("deve disparar o cancelamento se a mensagem for de cancelamento", async () => {
        const payload = {
            event: "messages.upsert",
            instance: "instancia-1",
            data: {
                key: { remoteJid: "5511988887777@s.whatsapp.net", fromMe: false },
                message: { extendedTextMessage: { text: "Pode cancelar" } }
            }
        };

        await sut.execute(payload);

        expect(cancelAppointment.execute).toHaveBeenCalledWith("company-1", "5511988887777");
        expect(confirmAppointment.execute).not.toHaveBeenCalled();
    });

    it("deve ignorar mensagens enviadas pelo próprio usuário (fromMe)", async () => {
        const payload = {
            event: "messages.upsert",
            instance: "instancia-1",
            data: {
                key: { remoteJid: "5511988887777@s.whatsapp.net", fromMe: true },
                message: { conversation: "Sim" }
            }
        };

        await sut.execute(payload);

        expect(confirmAppointment.execute).not.toHaveBeenCalled();
    });

    it("não deve fazer nada se a configuração da instância não for encontrada", async () => {
        vi.mocked(companyConfigRepository.findByInstanceName).mockResolvedValueOnce(null);

        const payload = {
            event: "messages.upsert",
            instance: "instancia-desconhecida",
            data: {
                key: { remoteJid: "5511988887777@s.whatsapp.net", fromMe: false },
                message: { conversation: "Sim" }
            }
        };

        await sut.execute(payload);

        expect(confirmAppointment.execute).not.toHaveBeenCalled();
    });

    it("não deve fazer nada se o evento não for messages.upsert e não for connection.update", async () => {
        const payload = { event: "other.event", instance: "instancia-1", data: {} };
        await sut.execute(payload);
        expect(confirmAppointment.execute).not.toHaveBeenCalled();
    });

    it("deve ignorar mensagens que não sejam confirmação nem cancelamento", async () => {
        const payload = {
            event: "messages.upsert",
            instance: "instancia-1",
            data: {
                key: { remoteJid: "5511988887777@s.whatsapp.net", fromMe: false },
                message: { conversation: "Qual o valor?" }
            }
        };

        await sut.execute(payload);

        expect(confirmAppointment.execute).not.toHaveBeenCalled();
        expect(cancelAppointment.execute).not.toHaveBeenCalled();
    });
});
