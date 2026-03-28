import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExchangeGoogleCodeUseCase } from "../exchange-google-code.usecase";
import { IGoogleCalendarService } from "../../ports/igoogle-calendar-service";
import { IUserConfigRepository } from "../../repositories/iuser-config-repository";
import { UserConfig } from "../../../infra/database/entities/user-config.entity";

describe("ExchangeGoogleCodeUseCase", () => {
    let sut: ExchangeGoogleCodeUseCase;
    let googleService: IGoogleCalendarService;
    let userConfigRepository: IUserConfigRepository;

    beforeEach(() => {
        googleService = {
            getAuthUrl: vi.fn(),
            getTokens: vi.fn().mockResolvedValue({
                access_token: "access-123",
                refresh_token: "refresh-123",
                expires_in: 3600
            }),
            refreshAccessToken: vi.fn(),
            listEvents: vi.fn(),
            updateEvent: vi.fn()
        };

        userConfigRepository = {
            findByUserId: vi.fn(),
            save: vi.fn(),
            update: vi.fn()
        };

        sut = new ExchangeGoogleCodeUseCase(googleService, userConfigRepository);
    });

    it("deve criar uma nova configuração se não existir para o usuário", async () => {
        vi.mocked(userConfigRepository.findByUserId).mockResolvedValueOnce(null);

        await sut.execute("user-1", "code-123");

        expect(googleService.getTokens).toHaveBeenCalledWith("code-123");
        expect(userConfigRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            userId: "user-1",
            googleAccessToken: "access-123",
            googleRefreshToken: "refresh-123"
        }));
    });

    it("deve atualizar configuração existente e manter o refresh token antigo se o novo for nulo", async () => {
        const existing = {
            userId: "user-1",
            googleRefreshToken: "old-refresh"
        } as UserConfig;

        vi.mocked(userConfigRepository.findByUserId).mockResolvedValueOnce(existing);
        vi.mocked(googleService.getTokens).mockResolvedValueOnce({
            access_token: "new-access",
            expires_in: 3600
            // sem refresh_token (comportamento padrão do Google em re-auth sem prompt=consent)
        });

        await sut.execute("user-1", "code-123");

        expect(userConfigRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            googleAccessToken: "new-access",
            googleRefreshToken: "old-refresh"
        }));
    });

    it("deve salvar a data de expiração correta", async () => {
        vi.mocked(userConfigRepository.findByUserId).mockResolvedValueOnce(null);
        
        const now = Date.now();
        vi.useFakeTimers();
        vi.setSystemTime(now);

        await sut.execute("user-1", "code-123");

        const expectedExpiry = new Date(now + 3600 * 1000);
        
        expect(userConfigRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            googleTokenExpiry: expectedExpiry
        }));

        vi.useRealTimers();
    });
});
