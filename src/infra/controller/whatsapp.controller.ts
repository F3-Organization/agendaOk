import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { ConnectWhatsappUseCase } from "../../usecase/notification/connect-whatsapp.usecase";
import { DisconnectWhatsappUseCase } from "../../usecase/notification/disconnect-whatsapp.usecase";

export class WhatsappController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly connectUseCase: ConnectWhatsappUseCase,
        private readonly disconnectUseCase: DisconnectWhatsappUseCase,
        private readonly subMiddleware?: any,
        private readonly adminMiddleware?: any
    ) {
        this.registerRoutes();
    }

    private registerRoutes() {
        const connectMiddlewares = [];
        if (this.adminMiddleware) connectMiddlewares.push(this.adminMiddleware);
        if (this.subMiddleware) connectMiddlewares.push(this.subMiddleware);

        this.fastify.addProtectedRoute("POST", "/whatsapp/connect", async (request, reply) => {
            const userId = (request.user as any).id;
            try {
                const qr = await this.connectUseCase.execute(userId);
                reply.send(qr);
            } catch (error: any) {
                console.error("[WhatsappController] Connection failed:", error);
                reply.code(500).send({ error: "Erro ao conectar WhatsApp", message: error.message });
            }
        }, {
            tags: ["WhatsApp"],
            summary: "Gera um QR Code para conexão do WhatsApp",
            description: "Cria uma instância na Evolution API e retorna o QR Code em Base64. Requer Token JWT, Role ADMIN e Assinatura Ativa.",
            response: {
                200: {
                    type: 'object',
                    properties: {
                        base64: { type: 'string', description: 'QR Code em formato Base64' }
                    }
                }
            }
        }, connectMiddlewares);

        this.fastify.addProtectedRoute("DELETE", "/whatsapp/disconnect", async (request, reply) => {
            const userId = (request.user as any).id;
            try {
                await this.disconnectUseCase.execute(userId);
                reply.send({ status: "success", message: "WhatsApp desconectado com sucesso" });
            } catch (error: any) {
                console.error("[WhatsappController] Disconnection failed:", error);
                reply.code(500).send({ error: "Erro ao desconectar WhatsApp", message: error.message });
            }
        }, {
            tags: ["WhatsApp"],
            summary: "Remove a conexão do WhatsApp",
            description: "Desloga e deleta a instância na Evolution API. Requer Token JWT e Role ADMIN.",
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }, this.adminMiddleware);
    }
}
