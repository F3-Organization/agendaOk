import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { LeadRepository } from "../database/repositories/lead.repository";
import { z } from "zod";

const leadSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().optional(),
});

export class LeadController {
    public constructor(
        private readonly fastify: FastifyAdapter,
        private readonly leadRepo: LeadRepository
    ) {
        this.registerRoutes();
    }

    private registerRoutes() {
        // Public route — no auth required
        this.fastify.addRoute(
            "POST",
            "/leads",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const parseResult = leadSchema.safeParse(request.body);
                if (!parseResult.success) {
                    return reply.code(400).send({
                        error: "Dados inválidos",
                        details: parseResult.error.format(),
                    });
                }

                const { name, email, phone } = parseResult.data;

                // Check if already registered
                const existing = await this.leadRepo.findByEmail(email);
                if (existing) {
                    return reply.send({
                        message: "Você já está na nossa lista! Entraremos em contato em breve.",
                        alreadyRegistered: true,
                    });
                }

                await this.leadRepo.create({ name, email, phone, source: "landing" });

                return reply.code(201).send({
                    message: "Cadastro realizado com sucesso! Entraremos em contato em breve.",
                    alreadyRegistered: false,
                });
            },
            {
                schema: {
                    tags: ["leads"],
                    summary: "Capture a lead from the landing page",
                    body: {
                        type: "object" as const,
                        required: ["name", "email"],
                        properties: {
                            name: { type: "string" as const },
                            email: { type: "string" as const },
                            phone: { type: "string" as const },
                        },
                    },
                },
            }
        );
    }
}
