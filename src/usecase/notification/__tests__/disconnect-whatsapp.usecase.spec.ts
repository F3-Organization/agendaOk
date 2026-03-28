import { describe, it, expect, vi, beforeEach } from "vitest";
import { DisconnectWhatsappUseCase } from "../disconnect-whatsapp.usecase";
import { IEvolutionService } from "../../ports/ievolution-service";
import { IUserConfigRepository } from "../../repositories/iuser-config-repository";
import { UserConfig } from "../../../infra/database/entities/user-config.entity";

describe("DisconnectWhatsappUseCase", () => {
    let sut: DisconnectWhatsappUseCase;
    let userConfigRepository: IUserConfigRepository;
    let evolutionService: IEvolutionService;

    const mockConfig = {
        userId: "user-1",
        whatsappInstanceName: "instancia-teste"
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
            connectInstance: vi.fn(),
            sendText: vi.fn(),
            logoutInstance: vi.fn().mockResolvedValue(undefined),
            deleteInstance: vi.fn().mockResolvedValue(undefined)
        };

        sut = new DisconnectWhatsappUseCase(userConfigRepository, evolutionService);
    });

    it("deve deslogar, deletar a instância e limpar o banco de dados", async () => {
        await sut.execute("user-1");

        expect(evolutionService.logoutInstance).toHaveBeenCalledWith("instancia-teste");
        expect(evolutionService.deleteInstance).toHaveBeenCalledWith("instancia-teste");
        expect(userConfigRepository.update).toHaveBeenCalledWith("user-1", {
            whatsappInstanceName: null
        });
    });

    it("não deve fazer nada se a configuração do usuário não for encontrada", async () => {
        vi.mocked(userConfigRepository.findByUserId).mockResolvedValueOnce(null);

        await sut.execute("user-unknown");

        expect(evolutionService.logoutInstance).not.toHaveBeenCalled();
        expect(userConfigRepository.update).not.toHaveBeenCalled();
    });

    it("não deve fazer nada se o usuário não tiver uma instância ativa", async () => {
        vi.mocked(userConfigRepository.findByUserId).mockResolvedValueOnce({
            userId: "user-1",
            whatsappInstanceName: undefined
        } as any);

        await sut.execute("user-1");

        expect(evolutionService.logoutInstance).not.toHaveBeenCalled();
        expect(userConfigRepository.update).not.toHaveBeenCalled();
    });

    it("deve limpar o banco de dados mesmo se a Evolution API falhar", async () => {
        vi.mocked(evolutionService.logoutInstance).mockRejectedValueOnce(new Error("API Error"));
        vi.mocked(evolutionService.deleteInstance).mockRejectedValueOnce(new Error("API Error"));

        await sut.execute("user-1");

        expect(userConfigRepository.update).toHaveBeenCalledWith("user-1", {
            whatsappInstanceName: null
        });
    });
});
