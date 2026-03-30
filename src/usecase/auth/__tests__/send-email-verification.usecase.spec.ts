import { describe, it, expect, vi, beforeEach } from "vitest";
import { SendEmailVerificationUseCase } from "../send-email-verification.usecase";
import { IMailService } from "../../ports/imail-service";
import { RedisService } from "../../../infra/database/redis.service";

describe("SendEmailVerificationUseCase", () => {
    let useCase: SendEmailVerificationUseCase;
    let mailService: IMailService;
    let redisService: RedisService;

    beforeEach(() => {
        mailService = {
            sendMail: vi.fn().mockResolvedValue(undefined),
        } as unknown as IMailService;
        
        redisService = {
            set: vi.fn().mockResolvedValue(undefined),
        } as unknown as RedisService;

        useCase = new SendEmailVerificationUseCase(mailService, redisService);
    });

    it("should generate a 6-digit code, store it in redis and send an email", async () => {
        const email = "test@example.com";
        await useCase.execute(email);

        expect(redisService.set).toHaveBeenCalledWith(
            `verify_email:${email}`,
            expect.stringMatching(/^\d{6}$/),
            900
        );
        expect(mailService.sendMail).toHaveBeenCalledWith(
            email,
            "AgendaOK - Verificação de E-mail",
            expect.stringContaining("Seu código de verificação")
        );
    });
});
