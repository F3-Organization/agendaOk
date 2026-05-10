import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenerateGoogleAuthUrlUseCase } from "../generate-google-auth-url.usecase";
import { IGoogleCalendarService } from "../../ports/igoogle-calendar-service";

describe("GenerateGoogleAuthUrlUseCase", () => {
    let sut: GenerateGoogleAuthUrlUseCase;
    let googleService: IGoogleCalendarService;

    beforeEach(() => {
        googleService = {
            getAuthUrl: vi.fn().mockReturnValue("https://google.com/auth"),
            getTokens: vi.fn(),
            refreshAccessToken: vi.fn(),
            listEvents: vi.fn(),
            updateEvent: vi.fn()
        };
        sut = new GenerateGoogleAuthUrlUseCase(googleService);
    });

    it("deve retornar a URL de autenticação do serviço", () => {
        const url = sut.execute();
        expect(url).toBe("https://google.com/auth");
        expect(googleService.getAuthUrl).toHaveBeenCalledTimes(1);
    });
});
