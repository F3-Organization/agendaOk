import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { ManageProfessionalsUseCase } from "../../usecase/company/manage-professionals.usecase";
import { ManageBotConfigUseCase } from "../../usecase/company/manage-bot-config.usecase";
import { InviteProfessionalUserUseCase } from "../../usecase/appointment/invite-professional-user.usecase";
import { AuthUserPayload } from "../types/auth.types";
import {
    createProfessionalSchema,
    updateProfessionalSchema,
    updateBotConfigSchema,
} from "./schemas/professional.schema";
import {
    listProfessionalsSchema,
    createProfessionalSwaggerSchema,
    updateProfessionalSwaggerSchema,
    deleteProfessionalSchema,
    getBotConfigSchema,
    updateBotConfigSwaggerSchema,
} from "./schemas/professional.swagger";

export class ProfessionalController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly manageProfessionals: ManageProfessionalsUseCase,
        private readonly manageBotConfig: ManageBotConfigUseCase,
        private readonly inviteProfessionalUser: InviteProfessionalUserUseCase
    ) {
        this.fastify.logInfo("[ProfessionalController] Initializing...");
        this.registerRoutes();
    }

    private registerRoutes() {
        // ── Professionals ──────────────────────────

        // GET /company/professionals
        this.fastify.addProtectedRoute("GET", "/company/professionals", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            if (!user.companyId) return reply.code(400).send({ error: "Company not selected" });
            try {
                const professionals = await this.manageProfessionals.list(user.companyId);
                reply.send(professionals);
            } catch (error: any) {
                reply.code(500).send({ error: "Failed to list professionals", message: error.message });
            }
        }, listProfessionalsSchema);

        // POST /company/professionals
        this.fastify.addProtectedRoute("POST", "/company/professionals", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            if (!user.companyId) return reply.code(400).send({ error: "Company not selected" });

            const parseResult = createProfessionalSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            try {
                const professional = await this.manageProfessionals.create({
                    companyId: user.companyId,
                    ...parseResult.data,
                });
                reply.code(201).send(professional);
            } catch (error: any) {
                reply.code(400).send({ error: "Failed to create professional", message: error.message });
            }
        }, createProfessionalSwaggerSchema);

        // PUT /company/professionals/:id
        this.fastify.addProtectedRoute("PUT", "/company/professionals/:id", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            if (!user.companyId) return reply.code(400).send({ error: "Company not selected" });
            const { id } = request.params as { id: string };

            const parseResult = updateProfessionalSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            try {
                await this.manageProfessionals.update({
                    id,
                    companyId: user.companyId,
                    ...parseResult.data,
                });
                reply.send({ message: "Professional updated successfully" });
            } catch (error: any) {
                if (error.message === "Professional not found") {
                    return reply.code(404).send({ error: error.message });
                }
                reply.code(400).send({ error: "Failed to update professional", message: error.message });
            }
        }, updateProfessionalSwaggerSchema);

        // POST /company/professionals/:id/invite
        this.fastify.addProtectedRoute("POST", "/company/professionals/:id/invite", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            if (!user.companyId) return reply.code(400).send({ error: "Company not selected" });
            const { id } = request.params as { id: string };

            const parseResult = z.object({ email: z.string().email() }).safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            try {
                const result = await this.inviteProfessionalUser.execute(id, user.companyId, parseResult.data.email);
                reply.send(result);
            } catch (error: any) {
                const status = error.statusCode ?? 400;
                reply.code(status).send({ error: error.message });
            }
        });

        // DELETE /company/professionals/:id
        this.fastify.addProtectedRoute("DELETE", "/company/professionals/:id", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            if (!user.companyId) return reply.code(400).send({ error: "Company not selected" });
            const { id } = request.params as { id: string };

            try {
                await this.manageProfessionals.delete(id, user.companyId);
                reply.send({ message: "Professional deleted successfully" });
            } catch (error: any) {
                if (error.message === "Professional not found") {
                    return reply.code(404).send({ error: error.message });
                }
                reply.code(400).send({ error: "Failed to delete professional", message: error.message });
            }
        }, deleteProfessionalSchema);

        // ── Bot Config ──────────────────────────

        // GET /company/bot-config
        this.fastify.addProtectedRoute("GET", "/company/bot-config", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            if (!user.companyId) return reply.code(400).send({ error: "Company not selected" });
            try {
                const config = await this.manageBotConfig.get(user.companyId);
                reply.send(config || {});
            } catch (error: any) {
                reply.code(500).send({ error: "Failed to get bot config", message: error.message });
            }
        }, getBotConfigSchema);

        // PUT /company/bot-config
        this.fastify.addProtectedRoute("PUT", "/company/bot-config", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            if (!user.companyId) return reply.code(400).send({ error: "Company not selected" });

            const parseResult = updateBotConfigSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            try {
                await this.manageBotConfig.update({
                    companyId: user.companyId,
                    ...parseResult.data,
                });
                reply.send({ message: "Bot config updated successfully" });
            } catch (error: any) {
                reply.code(400).send({ error: "Failed to update bot config", message: error.message });
            }
        }, updateBotConfigSwaggerSchema);
    }
}
