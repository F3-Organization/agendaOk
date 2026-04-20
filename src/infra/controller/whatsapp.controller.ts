import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { ConnectWhatsappUseCase } from "../../usecase/notification/connect-whatsapp.usecase";
import { DisconnectWhatsappUseCase } from "../../usecase/notification/disconnect-whatsapp.usecase";
import { GetWhatsappStatusUseCase } from "../../usecase/notification/get-whatsapp-status.usecase";
import { AuthUserPayload } from "../types/auth.types";

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
            
            try {
                const qr = await this.connectUseCase.execute(userId);
                return reply.send(qr);
            } catch (error: any) {
                this.fastify.logInfo("[WhatsappController] Connection Error", { error: error.message });
                return reply.code(error.status || 500).send({ 
                    error: "Connection Error", 
                    message: "Could not generate QR Code. Please try again later." 
                });
            }
        }, {
            tags: ["WhatsApp"],
            summary: "Generates a QR Code for WhatsApp connection",
            description: "Creates or retrieves an instance in the Evolution API and returns the Base64 QR Code for pairing.",
            response: {
                200: {
                    type: "object",
                    properties: {
                        instance: { type: "string" },
                        base64: { type: "string", description: "QR Code image in Base64" },
                        code: { type: "string", description: "Pairing code (text)" }
                    }
                },
                500: {
                    type: "object",
                    properties: {
                        error: { type: "string" },
                        message: { type: "string" }
                    }
                }
            }
        }, []);

        this.fastify.addProtectedRoute("GET", "/whatsapp/status", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            return await this.getStatusUseCase.execute(user.companyId!);
        }, {
            tags: ["WhatsApp"],
            summary: "Gets current WhatsApp connection status",
            description: "Queries the Evolution API to check if the user's instance is connected and returns the state.",
            response: {
                200: {
                    type: "object",
                    properties: {
                        status: { type: "string" },
                        instanceName: { type: "string", nullable: true }
                    }
                }
            }
        }, []);

        this.fastify.addProtectedRoute("DELETE", "/whatsapp/disconnect", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const userId = user.companyId!;
            
            try {
                await this.disconnectUseCase.execute(userId);
                return reply.send({ status: "success", message: "WhatsApp disconnected successfully." });
            } catch (error: any) {
                this.fastify.logInfo("[WhatsappController] Disconnection Error", { error: error.message });
                return reply.code(500).send({ 
                    error: "Disconnection Error", 
                    message: "There was an error while trying to disconnect WhatsApp." 
                });
            }
        }, {
            tags: ["WhatsApp"],
            summary: "Removes WhatsApp connection",
            description: "Ends the WhatsApp session and removes the instance linked to the user.",
            response: {
                200: {
                    type: "object",
                    properties: {
                        status: { type: "string", example: "success" },
                        message: { type: "string" }
                    }
                },
                500: {
                    type: "object",
                    properties: {
                        error: { type: "string" },
                        message: { type: "string" }
                    }
                }
            }
        }, []);
    }
}
