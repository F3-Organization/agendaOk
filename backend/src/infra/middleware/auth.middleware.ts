import { FastifyReply, FastifyRequest } from "fastify";

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        return reply.code(401).send(err);
    }
};
