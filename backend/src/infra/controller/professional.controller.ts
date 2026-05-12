import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { ManageProfessionalsUseCase } from "../../usecase/company/manage-professionals.usecase";
import { ManageBotConfigUseCase } from "../../usecase/company/manage-bot-config.usecase";
import { InviteProfessionalUserUseCase } from "../../usecase/appointment/invite-professional-user.usecase";
import { AuthUserPayload } from "../types/auth.types";
import { ownerOnlyMiddleware } from "../middleware/owner-only.middleware";
import { t } from "../../shared/i18n";
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

type TimeSlot = { start: string; end: string };
function filterWorkingHours(raw: Record<string, TimeSlot[] | undefined>): Record<string, TimeSlot[]> {
    return Object.fromEntries(
        Object.entries(raw).filter((entry): entry is [string, TimeSlot[]] => Array.isArray(entry[1]) && entry[1].length > 0)
    );
}

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

        // GET /company/professionals (owners only — professionals see only their own appointments)
        this.fastify.addProtectedRoute("GET", "/company/professionals", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            if (!user.companyId) return reply.code(400).send({ error: "Company not selected" });
            try {
                const professionals = await this.manageProfessionals.list(user.companyId);
                reply.send(professionals);
            } catch (error: any) {
                reply.code(500).send({ error: "Failed to list professionals", message: error.message });
            }
        }, listProfessionalsSchema, ownerOnlyMiddleware);

        // POST /company/professionals (owners only)
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
                    workingHours: parseResult.data.workingHours
                        ? filterWorkingHours(parseResult.data.workingHours)
                        : undefined,
                });
                reply.code(201).send(professional);
            } catch (error: any) {
                reply.code(400).send({ error: "Failed to create professional", message: error.message });
            }
        }, createProfessionalSwaggerSchema, ownerOnlyMiddleware);

        // PUT /company/professionals/:id (owners only)
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
                    locale: (request as any).locale,
                    ...parseResult.data,
                    workingHours: parseResult.data.workingHours
                        ? filterWorkingHours(parseResult.data.workingHours)
                        : undefined,
                });
                reply.send({ message: t((request as any).locale, "professional.updated") });
            } catch (error: any) {
                if (error.statusCode === 404) {
                    return reply.code(404).send({ error: error.message });
                }
                reply.code(400).send({ error: "Failed to update professional", message: error.message });
            }
        }, updateProfessionalSwaggerSchema, ownerOnlyMiddleware);

        // POST /company/professionals/:id/invite (owners only)
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
        }, undefined, ownerOnlyMiddleware);

        // DELETE /company/professionals/:id (owners only)
        this.fastify.addProtectedRoute("DELETE", "/company/professionals/:id", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            if (!user.companyId) return reply.code(400).send({ error: "Company not selected" });
            const { id } = request.params as { id: string };

            try {
                await this.manageProfessionals.delete(id, user.companyId, (request as any).locale);
                reply.send({ message: t((request as any).locale, "professional.deleted") });
            } catch (error: any) {
                if (error.statusCode === 404) {
                    return reply.code(404).send({ error: error.message });
                }
                reply.code(400).send({ error: "Failed to delete professional", message: error.message });
            }
        }, deleteProfessionalSchema, ownerOnlyMiddleware);

        // ── Bot Config ──────────────────────────

        // GET /company/bot-config (owners only)
        this.fastify.addProtectedRoute("GET", "/company/bot-config", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            if (!user.companyId) return reply.code(400).send({ error: "Company not selected" });
            try {
                const config = await this.manageBotConfig.get(user.companyId, (request as any).locale);
                reply.send(config || {});
            } catch (error: any) {
                reply.code(500).send({ error: "Failed to get bot config", message: error.message });
            }
        }, getBotConfigSchema, ownerOnlyMiddleware);

        // PUT /company/bot-config (owners only)
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
                    locale: (request as any).locale,
                    ...parseResult.data,
                });
                reply.send({ message: t((request as any).locale, "bot.updated") });
            } catch (error: any) {
                reply.code(400).send({ error: error.message });
            }
        }, updateBotConfigSwaggerSchema, ownerOnlyMiddleware);
    }
}
