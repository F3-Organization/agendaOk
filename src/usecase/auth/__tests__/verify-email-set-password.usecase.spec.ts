import { describe, it, expect, vi, beforeEach } from "vitest";
import { VerifyEmailSetPasswordUseCase } from "../verify-email-set-password.usecase";
import { UserRepository } from "../../../infra/database/repositories/user.repository";
import { RedisService } from "../../../infra/database/redis.service";
import { User } from "../../../infra/database/entities/user.entity";

describe("VerifyEmailSetPasswordUseCase", () => {
    let useCase: VerifyEmailSetPasswordUseCase;
    let userRepo: UserRepository;
    let redisService: RedisService;

    beforeEach(() => {
        userRepo = {
            findByEmail: vi.fn(),
            save: vi.fn().mockImplementation((user) => Promise.resolve(user)),
        } as unknown as UserRepository;

        redisService = {
            get: vi.fn(),
            del: vi.fn().mockResolvedValue(undefined),
        } as unknown as RedisService;

        useCase = new VerifyEmailSetPasswordUseCase(userRepo, redisService);
    });

    it("should set password and delete key if valid code is provided", async () => {
        const email = "test@example.com";
        const code = "123456";
        const password = "newpassword";
        
        const mockUser = new User();
        mockUser.email = email;

        vi.mocked(redisService.get).mockResolvedValue(code);
        vi.mocked(userRepo.findByEmail).mockResolvedValue(mockUser);

        const result = await useCase.execute(email, code, password);

        expect(result.password).not.toBeUndefined();
        expect(userRepo.save).toHaveBeenCalled();
        expect(redisService.del).toHaveBeenCalledWith(`verify_email:${email}`);
    });

    it("should throw error if code is invalid", async () => {
        const email = "test@example.com";
        const code = "123456";

        vi.mocked(redisService.get).mockResolvedValue("wrong-code");

        await expect(useCase.execute(email, code, "password")).rejects.toThrow("Invalid or expired verification code.");
    });
});
