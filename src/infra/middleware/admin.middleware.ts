import { FastifyRequest, FastifyReply } from "fastify";

export async function adminMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;
    
    if (!user || user.role !== "ADMIN") {
        return reply.code(403).send({ error: "Acesso restrito a administradores" });
    }
}
