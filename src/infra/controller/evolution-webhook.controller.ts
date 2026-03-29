import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { HandleEvolutionWebhookUseCase } from "../../usecase/notification/handle-evolution-webhook.usecase";
import { env } from "../config/configs";

export class EvolutionWebhookController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly handleWebhook: HandleEvolutionWebhookUseCase
    ) {
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.addRoute("POST", "/webhook/evolution", async (request, reply) => {
            const payload = request.body as any;
            
            try {
                // Validar apikey em produção
                if (env.isProduction() && payload?.apikey !== env.evolution.apiKey) {
                    return reply.code(401).send({ error: "Unauthorized webhook call" });
                }

                // Processamento assíncrono para não travar o webhook
                this.handleWebhook.execute(payload).catch(err => {
                    console.error("[WebhookController] Async processing failed:", err);
                });

                reply.send({ status: "received" });
            } catch (error: any) {
                console.error("[WebhookController] Webhook processing failed:", error);
                reply.code(500).send({ error: "Webhook processing error" });
            }
        }, {
            tags: ["Webhook"],
            summary: "Receives notifications from the Evolution API",
            description: "Main endpoint for receiving webhooks from the Evolution API. This channel is used to synchronize message status and WhatsApp connections in real-time.",
            body: {
                type: 'object',
                description: 'Evolution API Webhook Payload',
                properties: {
                    event: { 
                        type: 'string', 
                        description: 'Event type triggered by Evolution API',
                        enum: ['messages.upsert', 'messages.update', 'connection.update', 'qrcode.updated'],
                        example: 'messages.upsert' 
                    },
                    instance: { 
                        type: 'string', 
                        description: 'Name of the instance that originated the event',
                        example: 'MainInstance' 
                    },
                    data: { 
                        type: 'object', 
                        description: 'Detailed event data',
                        properties: {
                            key: {
                                type: 'object',
                                properties: {
                                    remoteJid: { type: 'string', example: '5511999999999@s.whatsapp.net', description: 'Contact/group ID' },
                                    fromMe: { type: 'boolean', example: false, description: 'If the message was sent by the instance itself' },
                                    id: { type: 'string', example: 'ABC123XYZ', description: 'Unique message ID' }
                                }
                            },
                            pushName: { type: 'string', example: 'John Doe', nullable: true, description: 'Contact name on WhatsApp' },
                            message: { type: 'object', additionalProperties: true, description: 'Message content (text, image, etc)' }
                        },
                        additionalProperties: true
                    },
                    destination: { type: 'string', description: 'Webhook destination URL', example: 'http://api:3000/api/webhook/evolution' },
                    date_time: { type: 'string', format: 'date-time', description: 'ISO format event date/time', example: '2026-03-28T22:00:00Z' },
                    sender: { type: 'string', description: 'Sender number (JID)', example: '5511999999999@s.whatsapp.net' },
                    server_url: { type: 'string', description: 'URL of the Evolution server that triggered the event', example: 'http://evolution:8080' },
                    apikey: { type: 'string', description: 'API key associated with the instance', example: 'TEST_API_KEY' }
                },
                required: ['event', 'instance', 'data']
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Receipt confirmation',
                    properties: {
                        status: { 
                            type: 'string', 
                            example: 'received',
                            description: 'Indicates the payload was accepted for processing' 
                        }
                    }
                },
                500: {
                    type: 'object',
                    description: 'Processing error',
                    properties: {
                        error: { type: 'string', example: 'Webhook processing error', description: 'Friendly error message' }
                    }
                }
            }
        });
    }
}
