import { FastifyRequest, FastifyReply } from "fastify";

export async function adminMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as any;

    if (!user || user.role !== "ADMIN") {
        request.log.warn({ userId: user?.id, url: request.url }, "[AdminMiddleware] Unauthorized admin access attempt");
        return reply.code(403).send({ error: "Acesso restrito a administradores" });
    }
}
