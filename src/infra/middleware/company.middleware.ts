import { FastifyReply, FastifyRequest } from "fastify";
import { AuthUserPayload } from "../types/auth.types";

export const companyMiddleware = (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
    const user = request.user as AuthUserPayload;
    if (!user?.companyId) {
        return reply.code(401).send({ error: "No company selected", message: "Select a company first" });
    }
    done();
};
