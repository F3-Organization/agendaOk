import { describe, it, expect, vi, beforeEach } from "vitest";
import { HandleEvolutionWebhookUseCase } from "../handle-evolution-webhook.usecase";
import { MessageParserService } from "../../chatbot/message-parser.service";
import { env } from "../../../infra/config/configs";

describe("HandleEvolutionWebhookUseCase", () => {
    let sut: HandleEvolutionWebhookUseCase;
    let connectionHandler: any;
    let userMessageHandler: any;
    let systemBotHandler: any;
    let lidResolver: any;

    beforeEach(() => {
        connectionHandler = { handle: vi.fn() };
        userMessageHandler = { handle: vi.fn() };
        systemBotHandler = { handle: vi.fn() };
        lidResolver = { resolve: vi.fn().mockResolvedValue(null) };

        sut = new HandleEvolutionWebhookUseCase(
            new MessageParserService(),
            connectionHandler,
            userMessageHandler,
            systemBotHandler,
            lidResolver
        );
    });

    it("encaminha mensagens de cliente para o UserMessageHandler", async () => {
        const payload = {
            event: "messages.upsert",
            instance: "instancia-1",
            data: {
                key: { remoteJid: "5511988887777@s.whatsapp.net", fromMe: false },
                message: { conversation: "Sim, confirmado" },
            },
        } as any;

        await sut.execute(payload);

        expect(userMessageHandler.handle).toHaveBeenCalledWith(
            "instancia-1",
            "5511988887777",
            "5511988887777@s.whatsapp.net",
            "Sim, confirmado",
            "text"
        );
        expect(systemBotHandler.handle).not.toHaveBeenCalled();
    });

    it("encaminha eventos connection.update para o ConnectionUpdateHandler", async () => {
        const payload = {
            event: "connection.update",
            instance: "instancia-1",
            data: { state: "open" },
        } as any;

        await sut.execute(payload);

        expect(connectionHandler.handle).toHaveBeenCalledWith("instancia-1", { state: "open" });
        expect(userMessageHandler.handle).not.toHaveBeenCalled();
    });

    it("roteia mensagens da instância do system bot para o SystemBotHandler", async () => {
        const payload = {
            event: "messages.upsert",
            instance: env.evolution.systemBotInstance,
            data: {
                key: { remoteJid: "5511988887777@s.whatsapp.net", fromMe: false },
                message: { conversation: "oi" },
            },
        } as any;

        await sut.execute(payload);

        expect(systemBotHandler.handle).toHaveBeenCalled();
        expect(userMessageHandler.handle).not.toHaveBeenCalled();
    });

    it("ignora mensagens enviadas pelo próprio usuário (fromMe)", async () => {
        const payload = {
            event: "messages.upsert",
            instance: "instancia-1",
            data: {
                key: { remoteJid: "5511988887777@s.whatsapp.net", fromMe: true },
                message: { conversation: "Sim" },
            },
        } as any;

        await sut.execute(payload);

        expect(userMessageHandler.handle).not.toHaveBeenCalled();
    });

    it("ignora eventos que não sejam messages.upsert nem connection.update", async () => {
        const payload = { event: "other.event", instance: "instancia-1", data: {} } as any;

        await sut.execute(payload);

        expect(connectionHandler.handle).not.toHaveBeenCalled();
        expect(userMessageHandler.handle).not.toHaveBeenCalled();
    });

    it("não chama o LidResolver quando o payload já traz o número real (senderPn)", async () => {
        const payload = {
            event: "messages.upsert",
            instance: "instancia-1",
            data: {
                key: { remoteJid: "123456789012345@lid", fromMe: false },
                senderPn: "5511955554444@s.whatsapp.net",
                message: { conversation: "oi" },
            },
        } as any;

        await sut.execute(payload);

        expect(lidResolver.resolve).not.toHaveBeenCalled();
        expect(userMessageHandler.handle).toHaveBeenCalledWith(
            "instancia-1",
            "5511955554444",
            "123456789012345@lid",
            "oi",
            "text"
        );
    });

    it("resolve o número real via LidResolver quando o remoteJid é um @lid", async () => {
        lidResolver.resolve.mockResolvedValueOnce("5511955554444");
        const payload = {
            event: "messages.upsert",
            instance: "instancia-1",
            data: {
                key: { remoteJid: "123456789012345@lid", fromMe: false },
                message: { conversation: "oi" },
            },
        } as any;

        await sut.execute(payload);

        expect(lidResolver.resolve).toHaveBeenCalledWith("instancia-1", "123456789012345@lid");
        expect(userMessageHandler.handle).toHaveBeenCalledWith(
            "instancia-1",
            "5511955554444",
            "123456789012345@lid",
            "oi",
            "text"
        );
    });
});
