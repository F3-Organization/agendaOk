import { FastifyReply, FastifyRequest } from "fastify";
import { AuthUserPayload } from "../types/auth.types";

/**
 * Middleware that blocks PROFESSIONAL role users from accessing owner-only routes.
 * Only USER and ADMIN roles are allowed through.
 */
export async function ownerOnlyMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as AuthUserPayload;

    if (user.role === "PROFESSIONAL") {
        return reply.code(403).send({
            error: "Forbidden",
            message: "This action is restricted to company owners.",
        });
    }
}
