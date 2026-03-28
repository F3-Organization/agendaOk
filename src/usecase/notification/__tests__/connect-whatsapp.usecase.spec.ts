import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConnectWhatsappUseCase } from "../connect-whatsapp.usecase";
import { IEvolutionService } from "../../ports/ievolution-service";
import { IUserConfigRepository } from "../../repositories/iuser-config-repository";
import { UserConfig } from "../../../infra/database/entities/user-config.entity";

describe("ConnectWhatsappUseCase", () => {
    let sut: ConnectWhatsappUseCase;
    let userConfigRepository: IUserConfigRepository;
    let evolutionService: IEvolutionService;

    const mockConfig = {
        userId: "user-1",
        whatsappInstanceName: undefined
    } as UserConfig;

    beforeEach(() => {
        userConfigRepository = {
            findByUserId: vi.fn().mockResolvedValue(mockConfig),
            update: vi.fn(),
            findByInstanceName: vi.fn(),
            save: vi.fn(),
            findAllActive: vi.fn()
        };

        evolutionService = {
            createInstance: vi.fn(),
            setWebhook: vi.fn(),
            connectInstance: vi.fn().mockResolvedValue({ base64: "qr-code-64" }),
            sendText: vi.fn(),
            logoutInstance: vi.fn(),
            deleteInstance: vi.fn()
        };

        sut = new ConnectWhatsappUseCase(userConfigRepository, evolutionService);
    });

    it("deve criar uma instancia, configurar webhook e retornar o QR Code", async () => {
        const result = await sut.execute("user-1");

        expect(evolutionService.createInstance).toHaveBeenCalled();
        expect(evolutionService.setWebhook).toHaveBeenCalled();
        expect(userConfigRepository.update).toHaveBeenCalledWith("user-1", expect.objectContaining({
            whatsappInstanceName: expect.stringContaining("agent_")
        }));
        expect(result).toEqual({ base64: "qr-code-64" });
    });

    it("deve continuar se a instancia já existir", async () => {
        vi.mocked(evolutionService.createInstance).mockRejectedValueOnce(new Error("Instance exists"));

        const result = await sut.execute("user-1");

        expect(evolutionService.setWebhook).toHaveBeenCalled();
        expect(result).toEqual({ base64: "qr-code-64" });
    });

    it("deve lançar erro se o usuário não tiver configuração", async () => {
        vi.mocked(userConfigRepository.findByUserId).mockResolvedValueOnce(null);

        await expect(sut.execute("user-2")).rejects.toThrow("User configuration not found");
    });
});
