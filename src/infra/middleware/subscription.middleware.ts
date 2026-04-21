import { FastifyReply, FastifyRequest } from "fastify";
import { SubscriptionStatus } from "../database/entities/subscription.entity";
import { isSubscriptionActive } from "../../usecase/subscription/subscription.helpers";

declare module 'fastify' {
    interface FastifyRequest {
        subscription?: {
            status: SubscriptionStatus;
            plan: string;
        };
    }
}

export const subscriptionMiddleware = (repository: any) => async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any).id;
    const subscription = await repository.findByUserId(userId);

    if (!isSubscriptionActive(subscription)) {
        return reply.code(403).send({ 
            error: "Subscription required", 
            message: "Essa funcionalidade exige uma assinatura PRO ativa.",
            status: subscription?.status || "INACTIVE"
        });
    }

    request.subscription = {
        status: subscription!.status,
        plan: subscription!.plan
    };
};
