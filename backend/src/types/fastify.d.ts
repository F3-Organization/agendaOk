import { FastifyRequest, FastifyReply } from "fastify";
import "@fastify/jwt";

declare module "@fastify/jwt" {
    interface FastifyJWT {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
        }
    }
}

declare module "fastify" {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
    
    interface FastifyRequest {
        jwtVerify(): Promise<void>;
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
    }
}
