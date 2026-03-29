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
            const userId = (request.user as { id: string }).id;
            
            try {
                const qr = await this.connectUseCase.execute(userId);
                return reply.send(qr);
            } catch (error: any) {
                return reply.code(error.status || 500).send({ 
                    error: "Connection Error", 
                    message: "Could not generate QR Code. Please try again later." 
                });
            }
        }, {
            tags: ["WhatsApp"],
            summary: "Generates a QR Code for WhatsApp connection",
            description: "Creates or retrieves an instance in the Evolution API and returns the Base64 QR Code for pairing."
        }, connectMiddlewares);

        this.fastify.addProtectedRoute("DELETE", "/whatsapp/disconnect", async (request, reply) => {
            const userId = (request.user as { id: string }).id;
            
            try {
                await this.disconnectUseCase.execute(userId);
                return reply.send({ status: "success", message: "WhatsApp disconnected successfully." });
            } catch (error: any) {
                return reply.code(500).send({ 
                    error: "Disconnection Error", 
                    message: "There was an error while trying to disconnect WhatsApp." 
                });
            }
        }, {
            tags: ["WhatsApp"],
            summary: "Removes WhatsApp connection",
            description: "Ends the WhatsApp session and removes the instance linked to the user."
        }, this.adminMiddleware);
    }
}
