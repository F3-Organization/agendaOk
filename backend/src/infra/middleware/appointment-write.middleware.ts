import { FastifyReply, FastifyRequest } from "fastify";
import { AuthUserPayload } from "../types/auth.types";

/**
 * Middleware that blocks PROFESSIONAL role users from write operations on appointments.
 * Allows OWNER (USER/ADMIN) and ATTENDANT roles through.
 * PROFESSIONAL users can only read appointments (GET), not create/update/delete.
 */
export async function appointmentWriteMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as AuthUserPayload;

    if (user.role === "PROFESSIONAL") {
        return reply.code(403).send({
            error: "Forbidden",
            message: "Professionals cannot modify appointments.",
        });
    }
}
