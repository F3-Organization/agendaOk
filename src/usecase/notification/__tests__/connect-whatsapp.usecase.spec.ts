import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConnectWhatsappUseCase } from "../connect-whatsapp.usecase";
import { IEvolutionService } from "../../ports/ievolution-service";
import { ICompanyConfigRepository } from "../../repositories/icompany-config-repository";
import { CompanyConfig } from "../../../infra/database/entities/company-config.entity";

describe("ConnectWhatsappUseCase", () => {
    let sut: ConnectWhatsappUseCase;
    let companyConfigRepository: ICompanyConfigRepository;
    let evolutionService: IEvolutionService;

    const mockConfig = {
        companyId: "user-1",
        whatsappInstanceName: undefined
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
            connectInstance: vi.fn().mockResolvedValue({ base64: "qr-code-64" }),
            sendText: vi.fn(),
            logoutInstance: vi.fn(),
            deleteInstance: vi.fn()
        };

        sut = new ConnectWhatsappUseCase(companyConfigRepository, evolutionService);
    });

    it("deve criar uma instancia, configurar webhook e retornar o QR Code", async () => {
        const result = await sut.execute("user-1");

        expect(evolutionService.createInstance).toHaveBeenCalled();
        expect(evolutionService.setWebhook).toHaveBeenCalled();
        expect(companyConfigRepository.updateByCompanyId).toHaveBeenCalledWith("user-1", expect.objectContaining({
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
        vi.mocked(companyConfigRepository.findByCompanyId).mockResolvedValueOnce(null);

        await expect(sut.execute("user-2")).rejects.toThrow("User configuration not found");
    });
});
