import { describe, it, expect, vi, beforeEach } from "vitest";
import { HandleEvolutionWebhookUseCase } from "../handle-evolution-webhook.usecase";
import { IUserConfigRepository } from "../../repositories/iuser-config-repository";
import { ConfirmAppointmentUseCase } from "../../calendar/confirm-appointment.usecase";
import { CancelAppointmentUseCase } from "../../calendar/cancel-appointment.usecase";
import { UserConfig } from "../../../infra/database/entities/user-config.entity";

describe("HandleEvolutionWebhookUseCase", () => {
    let sut: HandleEvolutionWebhookUseCase;
    let userConfigRepository: IUserConfigRepository;
    let confirmAppointment: ConfirmAppointmentUseCase;
    let cancelAppointment: CancelAppointmentUseCase;

    const mockConfig = {
        userId: "user-1",
        whatsappInstanceName: "instancia-1"
    } as UserConfig;

    beforeEach(() => {
        userConfigRepository = {
            findByUserId: vi.fn(),
            findByInstanceName: vi.fn().mockResolvedValue(mockConfig),
            save: vi.fn(),
            update: vi.fn(),
            findAllActive: vi.fn()
        };

        confirmAppointment = {
            execute: vi.fn()
        } as any;

        cancelAppointment = {
            execute: vi.fn()
        } as any;

        sut = new HandleEvolutionWebhookUseCase(
            userConfigRepository, 
            confirmAppointment,
            cancelAppointment
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

        expect(confirmAppointment.execute).toHaveBeenCalledWith("user-1", "5511988887777");
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

        expect(cancelAppointment.execute).toHaveBeenCalledWith("user-1", "5511988887777");
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
        vi.mocked(userConfigRepository.findByInstanceName).mockResolvedValueOnce(null);

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

    it("não deve fazer nada se o evento não for messages.upsert", async () => {
        const payload = { event: "connection.update" };
        await sut.execute(payload);
        expect(userConfigRepository.findByInstanceName).not.toHaveBeenCalled();
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
