import { describe, it, expect, vi, beforeEach } from "vitest";
import { HandleEvolutionWebhookUseCase } from "../handle-evolution-webhook.usecase";
import { IUserConfigRepository } from "../../repositories/iuser-config-repository";
import { ConfirmAppointmentUseCase } from "../../calendar/confirm-appointment.usecase";
import { UserConfig } from "../../../infra/database/entities/user-config.entity";

describe("HandleEvolutionWebhookUseCase", () => {
    let sut: HandleEvolutionWebhookUseCase;
    let userConfigRepository: IUserConfigRepository;
    let confirmAppointment: ConfirmAppointmentUseCase;

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

        sut = new HandleEvolutionWebhookUseCase(userConfigRepository, confirmAppointment);
    });

    it("deve disparar a confirmação se a mensagem for 'Sim'", async () => {
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

    it("deve ignorar mensagens que não sejam confirmação", async () => {
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
    });
});
