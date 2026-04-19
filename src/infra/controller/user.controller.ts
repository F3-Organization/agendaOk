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
} from "../../../shared/schemas/user.schema";
import { FastifyAdapter } from "../adapters/fastfy.adapter";

export class UserController {
    constructor(
        private readonly fastifyAdapter: FastifyAdapter,
        private readonly getUserConfigUseCase: GetUserConfigUseCase,
        private readonly updateUserConfigUseCase: UpdateUserConfigUseCase,
        private readonly changePasswordUseCase: ChangePasswordUseCase,
        private readonly setPasswordUseCase: SetPasswordUseCase,
        private readonly toggle2FAUseCase: Toggle2FAUseCase,
        private readonly verify2FAUseCase: Verify2FAUseCase
    ) {
        this.registerRoutes();
    }

    private registerRoutes(): void {
        this.fastifyAdapter.addProtectedRoute(
            "GET",
            "/user/config",
            this.getUserConfig.bind(this)
        );

        this.fastifyAdapter.addProtectedRoute(
            "PATCH",
            "/user/config",
            this.updateUserConfig.bind(this)
        );

        this.fastifyAdapter.addProtectedRoute(
            "POST",
            "/user/change-password",
            this.changePassword.bind(this)
        );
        
        this.fastifyAdapter.addProtectedRoute(
            "POST",
            "/user/set-password",
            this.setPassword.bind(this)
        );

        this.fastifyAdapter.addProtectedRoute(
            "POST",
            "/user/toggle-2fa",
            this.toggle2FA.bind(this)
        );

        this.fastifyAdapter.addProtectedRoute(
            "POST",
            "/user/verify-2fa",
            this.verify2FA.bind(this)
        );
    }

    async getUserConfig(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const userId = (request.user as any).id;
        const config = await this.getUserConfigUseCase.execute(userId);
        reply.send(config);
    }

    async updateUserConfig(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user = request.user as any;
        const userId = user.id;
        const companyId = user.companyId || userId;
        const data = updateUserConfigSchema.parse(request.body);
        
        await this.updateUserConfigUseCase.execute(userId, companyId, data);
        
        reply.status(200).send({ message: "Configurações atualizadas com sucesso" });
    }

    async changePassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const userId = (request.user as any).id;
        const data = changePasswordSchema.parse(request.body);

        try {
            await this.changePasswordUseCase.execute(userId, data);
            reply.status(200).send({ message: "Senha alterada com sucesso" });
        } catch (error: any) {
            reply.status(400).send({ error: error.message });
        }
    }

    async setPassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const userId = (request.user as any).id;
        const data = setPasswordSchema.parse(request.body);

        try {
            await this.setPasswordUseCase.execute(userId, data);
            reply.status(200).send({ message: "Senha definida com sucesso" });
        } catch (error: any) {
            reply.status(error.statusCode || 400).send({ error: error.message });
        }
    }

    async toggle2FA(req: FastifyRequest, reply: FastifyReply) {
        const userId = (req.user as { id: string }).id;
        const { enabled } = toggle2FASchema.parse(req.body);
        const result = await this.toggle2FAUseCase.execute(userId, enabled);
        return reply.send(result);
    }

    async verify2FA(req: FastifyRequest, reply: FastifyReply) {
        const userId = (req.user as { id: string }).id;
        const { token } = verify2FASchema.parse(req.body);
        await this.verify2FAUseCase.execute(userId, token);
        return reply.status(204).send();
    }
}
