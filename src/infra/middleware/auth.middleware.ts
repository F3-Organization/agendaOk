import { FastifyReply, FastifyRequest } from "fastify";

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
};

export const adminMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    if (user?.role !== "ADMIN") {
        reply.code(403).send({ error: "Acesso restrito a administradores" });
    }
};
