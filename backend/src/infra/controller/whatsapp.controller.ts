import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { ConnectWhatsappUseCase } from "../../usecase/notification/connect-whatsapp.usecase";
import { DisconnectWhatsappUseCase } from "../../usecase/notification/disconnect-whatsapp.usecase";
import { GetWhatsappStatusUseCase } from "../../usecase/notification/get-whatsapp-status.usecase";
import { AuthUserPayload } from "../types/auth.types";
import { ownerOnlyMiddleware } from "../middleware/owner-only.middleware";
import { t } from "../../shared/i18n";
import {
    connectWhatsappSchema,
    getWhatsappStatusSchema,
    disconnectWhatsappSchema
} from "./schemas/whatsapp.swagger";

export class WhatsappController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly connectUseCase: ConnectWhatsappUseCase,
        private readonly disconnectUseCase: DisconnectWhatsappUseCase,
        private readonly getStatusUseCase: GetWhatsappStatusUseCase
    ) {
        this.fastify.logInfo("[WhatsappController] Initializing...");
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.addProtectedRoute("POST", "/whatsapp/connect", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const userId = user.companyId!;
            const locale = (request as any).locale ?? "pt";
            
            try {
                const qr = await this.connectUseCase.execute(userId, locale);
                return reply.send(qr);
            } catch (error: any) {
                this.fastify.logInfo("[WhatsappController] Connection Error", { error: error.message });
                return reply.code(error.status || 500).send({ 
                    error: t(locale, "whatsapp.connectionError"), 
                    message: t(locale, "whatsapp.connectionErrorMessage") 
                });
            }
        }, connectWhatsappSchema, ownerOnlyMiddleware);

        this.fastify.addProtectedRoute("GET", "/whatsapp/status", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            return await this.getStatusUseCase.execute(user.companyId!);
        }, getWhatsappStatusSchema, ownerOnlyMiddleware);

        this.fastify.addProtectedRoute("DELETE", "/whatsapp/disconnect", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const userId = user.companyId!;
            const locale = (request as any).locale ?? "pt";
            
            try {
                await this.disconnectUseCase.execute(userId);
                return reply.send({ status: "success", message: t(locale, "whatsapp.disconnected") });
            } catch (error: any) {
                this.fastify.logInfo("[WhatsappController] Disconnection Error", { error: error.message });
                return reply.code(500).send({ 
                    error: t(locale, "whatsapp.disconnectionError"), 
                    message: t(locale, "whatsapp.disconnectionErrorMessage") 
                });
            }
        }, disconnectWhatsappSchema, ownerOnlyMiddleware);
    }
}
