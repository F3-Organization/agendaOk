import { describe, it, expect, vi, beforeEach } from "vitest";
import { DisconnectWhatsappUseCase } from "../disconnect-whatsapp.usecase";
import { IEvolutionService } from "../../ports/ievolution-service";
import { ICompanyConfigRepository } from "../../repositories/icompany-config-repository";
import { CompanyConfig } from "../../../infra/database/entities/company-config.entity";

describe("DisconnectWhatsappUseCase", () => {
    let sut: DisconnectWhatsappUseCase;
    let companyConfigRepository: ICompanyConfigRepository;
    let evolutionService: IEvolutionService;

    const mockConfig = {
        companyId: "user-1",
        whatsappInstanceName: "instancia-teste"
    } as CompanyConfig;

    beforeEach(() => {
        companyConfigRepository = {
            findByCompanyId: vi.fn().mockResolvedValue(mockConfig),
            updateByCompanyId: vi.fn(),
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
            deleteInstance: vi.fn().mockResolvedValue(undefined),
            fetchInstance: vi.fn(),
            fetchInstanceToken: vi.fn().mockResolvedValue(null),
            health: vi.fn()
        };

        sut = new DisconnectWhatsappUseCase(companyConfigRepository, evolutionService);
    });

    it("deve deslogar, deletar a instância e limpar o banco de dados", async () => {
        await sut.execute("user-1");

        expect(evolutionService.logoutInstance).toHaveBeenCalledWith("instancia-teste");
        expect(evolutionService.deleteInstance).toHaveBeenCalledWith("instancia-teste");
        expect(companyConfigRepository.updateByCompanyId).toHaveBeenCalledWith("user-1", {
            whatsappInstanceName: null,
            whatsappInstanceToken: null
        });
    });

    it("não deve fazer nada se a configuração do usuário não for encontrada", async () => {
        vi.mocked(companyConfigRepository.findByCompanyId).mockResolvedValueOnce(null);

        await sut.execute("user-unknown");

        expect(evolutionService.logoutInstance).not.toHaveBeenCalled();
        expect(companyConfigRepository.updateByCompanyId).not.toHaveBeenCalled();
    });

    it("não deve fazer nada se o usuário não tiver uma instância ativa", async () => {
        vi.mocked(companyConfigRepository.findByCompanyId).mockResolvedValueOnce({
            companyId: "user-1",
            whatsappInstanceName: undefined
        } as any);

        await sut.execute("user-1");

        expect(evolutionService.logoutInstance).not.toHaveBeenCalled();
        expect(companyConfigRepository.updateByCompanyId).not.toHaveBeenCalled();
    });

    it("deve limpar o banco de dados mesmo se a Evolution API falhar", async () => {
        vi.mocked(evolutionService.logoutInstance).mockRejectedValueOnce(new Error("API Error"));
        vi.mocked(evolutionService.deleteInstance).mockRejectedValueOnce(new Error("API Error"));

        await sut.execute("user-1");

        expect(companyConfigRepository.updateByCompanyId).toHaveBeenCalledWith("user-1", {
            whatsappInstanceName: null,
            whatsappInstanceToken: null
        });
    });
});
