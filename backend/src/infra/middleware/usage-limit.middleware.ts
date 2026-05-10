import { FastifyReply, FastifyRequest } from "fastify";
import { CheckUsageLimitUseCase } from "../../usecase/subscription/check-usage-limit.usecase";

/**
 * Middleware to check if the user has reached their monthly message limit.
 * Blocks requests with 403 if the limit is exceeded.
 */
export const usageLimitMiddleware = (useCase: CheckUsageLimitUseCase) => async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    if (!user) return;

    const result = await useCase.execute(user.id);

    if (!result.canSend) {
        return reply.code(403).send({ 
            error: "Usage limit reached", 
            message: "Você atingiu o limite de 50 mensagens mensais do plano FREE. Faça o upgrade para PRO para continuar.",
            count: result.count,
            limit: result.limit
        });
    }
};
