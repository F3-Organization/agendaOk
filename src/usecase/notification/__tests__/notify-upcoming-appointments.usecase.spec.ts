import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NotifyUpcomingAppointmentsUseCase } from "../notify-upcoming-appointments.usecase";
import { IEvolutionService } from "../../ports/ievolution-service";
import { IScheduleRepository } from "../../repositories/ischedule-repository";
import { IUserConfigRepository } from "../../repositories/iuser-config-repository";
import { IClientRepository } from "../../repositories/iclient-repository";
import { UserConfig } from "../../../infra/database/entities/user-config.entity";
import { Schedule } from "../../../infra/database/entities/schedule.entity";

describe("NotifyUpcomingAppointmentsUseCase", () => {
    let sut: NotifyUpcomingAppointmentsUseCase;
    let googleService: any;
    let scheduleRepository: IScheduleRepository;
    let userConfigRepository: IUserConfigRepository;
    let clientRepository: IClientRepository;
    let evolutionService: IEvolutionService;

    const mockConfig = {
        userId: "user-1",
        whatsappInstanceName: "instancia-1"
    } as UserConfig;

    beforeEach(() => {
        scheduleRepository = {
            save: vi.fn(),
            findByGoogleEventId: vi.fn(),
            findByUserId: vi.fn(),
            findNextToNotify: vi.fn().mockResolvedValue([]),
            updateStatus: vi.fn(),
            updateNotified: vi.fn()
        };

        userConfigRepository = {
            findByUserId: vi.fn().mockResolvedValue(mockConfig),
            findByInstanceName: vi.fn().mockResolvedValue(mockConfig),
            save: vi.fn(),
            update: vi.fn(),
            findAllActive: vi.fn()
        };

        evolutionService = {
            sendText: vi.fn(),
            createInstance: vi.fn(),
            setWebhook: vi.fn(),
            logoutInstance: vi.fn(),
            deleteInstance: vi.fn()
        };

        clientRepository = {
            save: vi.fn(),
            findById: vi.fn(),
            findByUserId: vi.fn(),
            findByNameOrEmail: vi.fn()
        };

        sut = new NotifyUpcomingAppointmentsUseCase(
            scheduleRepository,
            userConfigRepository,
            clientRepository,
            evolutionService
        );

        // Garante que o teste rode fora da janela de silêncio por padrão
        vi.setSystemTime(new Date("2024-03-28T14:00:00"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("deve extrair o número de telefone do título do evento e enviar a mensagem", async () => {
        const appointment = {
            id: "1",
            title: "Corte João (11) 98888-7777",
            startAt: new Date(),
            isNotified: false
        } as Schedule;

        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([appointment]);

        await sut.execute("user-1");

        expect(evolutionService.sendText).toHaveBeenCalledWith(
            "instancia-1",
            "5511988887777",
            expect.stringContaining("Corte João")
        );
        expect(scheduleRepository.updateNotified).toHaveBeenCalledWith("1", true);
    });

    it("deve extrair o número mesmo se estiver na descrição", async () => {
        const appointment = {
            id: "2",
            title: "Reunião Teste",
            description: "Contato: 11955554444",
            startAt: new Date(),
            isNotified: false
        } as Schedule;

        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([appointment]);

        await sut.execute("user-1");

        expect(evolutionService.sendText).toHaveBeenCalledWith(
            "instancia-1",
            "5511955554444",
            expect.any(String)
        );
    });

    it("não deve enviar mensagem se nenhum número for encontrado", async () => {
        const appointment = {
            id: "3",
            title: "Evento sem telefone",
            startAt: new Date(),
            isNotified: false
        } as Schedule;

        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([appointment]);

        await sut.execute("user-1");

        expect(evolutionService.sendText).not.toHaveBeenCalled();
        expect(scheduleRepository.updateNotified).not.toHaveBeenCalled();
    });

    it("deve logar erro mas continuar o loop se uma mensagem falhar", async () => {
        const app1 = { id: "1", title: "App 1 (11) 91111-1111", startAt: new Date() } as Schedule;
        const app2 = { id: "2", title: "App 2 (11) 92222-2222", startAt: new Date() } as Schedule;

        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([app1, app2]);
        vi.mocked(evolutionService.sendText).mockRejectedValueOnce(new Error("API Down"));

        await sut.execute("user-1");

        expect(evolutionService.sendText).toHaveBeenCalledTimes(2);
        expect(scheduleRepository.updateNotified).toHaveBeenCalledTimes(1); // Somente o segundo app
        expect(scheduleRepository.updateNotified).toHaveBeenCalledWith("2", true);
    });

    it("não deve enviar mensagens se estiver na janela de silêncio (ex: 22h)", async () => {
        vi.setSystemTime(new Date("2024-03-28T22:00:00"));
        
        const appointment = { id: "1", title: "App (11) 91111-1111", startAt: new Date() } as Schedule;
        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([appointment]);

        await sut.execute("user-1");

        expect(evolutionService.sendText).not.toHaveBeenCalled();
    });

    it("deve buscar o telefone no clientRepository se não encontrar no título (Fallback Strategy)", async () => {
        const appointment = { 
            id: "1", 
            title: "João Silva", 
            startAt: new Date(),
            clientId: "client-1"
        } as Schedule;

        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([appointment]);
        vi.mocked(clientRepository.findById).mockResolvedValueOnce({ id: "client-1", phone: "5511999998888" } as any);

        await sut.execute("user-1");

        expect(clientRepository.findById).toHaveBeenCalledWith("client-1");
        expect(evolutionService.sendText).toHaveBeenCalledWith(
            "instancia-1",
            "5511999998888",
            expect.any(String)
        );
    });

    it("deve buscar o telefone pelo nome no clientRepository se não tiver clientId no schedule", async () => {
        const appointment = { 
            id: "1", 
            title: "Maria Oliveira", 
            startAt: new Date()
        } as Schedule;

        vi.mocked(scheduleRepository.findNextToNotify).mockResolvedValueOnce([appointment]);
        vi.mocked(clientRepository.findByNameOrEmail).mockResolvedValueOnce({ id: "client-2", phone: "5511977776666" } as any);

        await sut.execute("user-1");

        expect(clientRepository.findByNameOrEmail).toHaveBeenCalledWith("user-1", "Maria Oliveira");
        expect(evolutionService.sendText).toHaveBeenCalledWith(
            "instancia-1",
            "5511977776666",
            expect.any(String)
        );
    });

    it("não deve disparar notificações se o usuário não tiver configuração ou instância configurada", async () => {
        vi.mocked(userConfigRepository.findByUserId).mockResolvedValueOnce({
            userId: "user-sem-wa",
            whatsappInstanceName: undefined
        } as UserConfig);

        await sut.execute("user-sem-wa");

        expect(scheduleRepository.findNextToNotify).not.toHaveBeenCalled();
    });
});
