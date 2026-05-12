import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { GetUserConfigUseCase } from "../../usecase/user/get-user-config.usecase";
import { UpdateUserConfigUseCase } from "../../usecase/user/update-user-config.usecase";
import { ChangePasswordUseCase } from "../../usecase/user/change-password.usecase";
import { SetPasswordUseCase } from "../../usecase/user/set-password.usecase";
import { Toggle2FAUseCase } from "../../usecase/user/toggle-2fa.usecase";
import { Verify2FAUseCase } from "../../usecase/user/verify-2fa.usecase";
import { 
    updateUserConfigSchema, 
    changePasswordSchema,
    setPasswordSchema,
    toggle2FASchema,
    verify2FASchema
} from "../../../../shared/schemas/user.schema";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { ICompanyRepository } from "../../usecase/repositories/icompany-repository";
import { t } from "../../shared/i18n";
import {
    getUserConfigSchema,
    updateUserConfigSwaggerSchema,
    changePasswordSwaggerSchema,
    setPasswordSwaggerSchema,
    toggle2FASwaggerSchema,
    verify2FASwaggerSchema
} from "./schemas/user.swagger";

export class UserController {
    constructor(
        private readonly fastifyAdapter: FastifyAdapter,
        private readonly getUserConfigUseCase: GetUserConfigUseCase,
        private readonly updateUserConfigUseCase: UpdateUserConfigUseCase,
        private readonly changePasswordUseCase: ChangePasswordUseCase,
        private readonly setPasswordUseCase: SetPasswordUseCase,
        private readonly toggle2FAUseCase: Toggle2FAUseCase,
        private readonly verify2FAUseCase: Verify2FAUseCase,
        private readonly companyRepo: ICompanyRepository
    ) {
        this.registerRoutes();
    }

    private registerRoutes(): void {
        this.fastifyAdapter.addProtectedRoute(
            "GET",
            "/user/config",
            this.getUserConfig.bind(this),
            getUserConfigSchema
        );

        this.fastifyAdapter.addProtectedRoute(
            "PATCH",
            "/user/config",
            this.updateUserConfig.bind(this),
            updateUserConfigSwaggerSchema
        );

        this.fastifyAdapter.addProtectedRoute(
            "POST",
            "/user/change-password",
            this.changePassword.bind(this),
            changePasswordSwaggerSchema
        );
        
        this.fastifyAdapter.addProtectedRoute(
            "POST",
            "/user/set-password",
            this.setPassword.bind(this),
            setPasswordSwaggerSchema
        );

        this.fastifyAdapter.addProtectedRoute(
            "POST",
            "/user/toggle-2fa",
            this.toggle2FA.bind(this),
            toggle2FASwaggerSchema
        );

        this.fastifyAdapter.addProtectedRoute(
            "POST",
            "/user/verify-2fa",
            this.verify2FA.bind(this),
            verify2FASwaggerSchema
        );
    }

    async getUserConfig(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user = request.user as any;
        const userId = user.id;
        let companyId = user.companyId;
        if (!companyId) {
            const companies = await this.companyRepo.findByOwnerId(userId);
            companyId = companies[0]?.id;
        }
        const config = await this.getUserConfigUseCase.execute(userId, companyId);
        reply.send(config);
    }

    async updateUserConfig(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user = request.user as any;
        const userId = user.id;
        const locale = (request as any).locale ?? "pt";
        let companyId = user.companyId;
        if (!companyId) {
            const companies = await this.companyRepo.findByOwnerId(userId);
            companyId = companies[0]?.id;
        }
        if (!companyId) {
            return reply.code(400).send({ error: t(locale, "user.noCompanyFound") });
        }
        const data = updateUserConfigSchema.parse(request.body);

        await this.updateUserConfigUseCase.execute(userId, companyId, data, locale);

        reply.status(200).send({ message: t(locale, "user.configUpdated") });
    }

    async changePassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const userId = (request.user as any).id;
        const data = changePasswordSchema.parse(request.body);

        try {
            const locale = (request as any).locale ?? "pt";
            await this.changePasswordUseCase.execute(userId, data, locale);
            reply.status(200).send({ message: t(locale, "user.passwordChanged") });
        } catch (error: any) {
            reply.status(400).send({ error: error.message });
        }
    }

    async setPassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const userId = (request.user as any).id;
        const data = setPasswordSchema.parse(request.body);

        try {
            const locale = (request as any).locale ?? "pt";
            await this.setPasswordUseCase.execute(userId, data, locale);
            reply.status(200).send({ message: t(locale, "user.passwordSet") });
        } catch (error: any) {
            reply.status(error.statusCode || 400).send({ error: error.message });
        }
    }

    async toggle2FA(req: FastifyRequest, reply: FastifyReply) {
        const userId = (req.user as { id: string }).id;
        const { enabled } = toggle2FASchema.parse(req.body);
        const result = await this.toggle2FAUseCase.execute(userId, enabled, (req as any).locale);
        return reply.send(result);
    }

    async verify2FA(req: FastifyRequest, reply: FastifyReply) {
        const userId = (req.user as { id: string }).id;
        const { token } = verify2FASchema.parse(req.body);
        const locale = (req as any).locale ?? "pt";
        await this.verify2FAUseCase.execute(userId, token, locale);
        return reply.status(204).send();
    }
}
