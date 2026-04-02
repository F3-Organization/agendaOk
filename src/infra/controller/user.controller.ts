import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { GetUserConfigUseCase } from "../../usecase/user/get-user-config.usecase";
import { UpdateUserConfigUseCase } from "../../usecase/user/update-user-config.usecase";
import { updateUserConfigSchema } from "../../../shared/schemas/user.schema";
import { FastifyAdapter } from "../adapters/fastfy.adapter";

export class UserController {
    constructor(
        private readonly fastifyAdapter: FastifyAdapter,
        private readonly getUserConfigUseCase: GetUserConfigUseCase,
        private readonly updateUserConfigUseCase: UpdateUserConfigUseCase
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
    }

    async getUserConfig(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const userId = (request.user as any).id;
        const config = await this.getUserConfigUseCase.execute(userId);
        reply.send(config);
    }

    async updateUserConfig(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const userId = (request.user as any).id;
        const data = updateUserConfigSchema.parse(request.body);
        
        await this.updateUserConfigUseCase.execute(userId, data);
        
        reply.status(200).send({ message: "Configurações atualizadas com sucesso" });
    }
}
