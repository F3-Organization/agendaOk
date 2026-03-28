import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { HandleEvolutionWebhookUseCase } from "../../usecase/notification/handle-evolution-webhook.usecase";

export class EvolutionWebhookController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly handleWebhook: HandleEvolutionWebhookUseCase
    ) {
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.addRoute("POST", "/webhook/evolution", async (request, reply) => {
            const payload = request.body;
            
            try {
                // Processamento assíncrono para não travar o webhook
                this.handleWebhook.execute(payload).catch(err => {
                    console.error("[WebhookController] Async processing failed:", err);
                });

                reply.send({ status: "received" });
            } catch (error: any) {
                console.error("[WebhookController] Webhook registration failed:", error);
                reply.code(500).send({ error: "Webhook processing error" });
            }
        }, {
            tags: ["Webhook"],
            summary: "Recebe notificações da Evolution API",
            description: "Endpoint principal para recebimento de webhooks vindos da Evolution API. Este canal é usado para sincronizar o status das mensagens e conexões do WhatsApp em tempo real.",
            body: {
                type: 'object',
                description: 'Payload do Webhook da Evolution API',
                properties: {
                    event: { 
                        type: 'string', 
                        description: 'Tipo do evento disparado pela Evolution API',
                        enum: ['messages.upsert', 'messages.update', 'connection.update', 'qrcode.updated'],
                        example: 'messages.upsert' 
                    },
                    instance: { 
                        type: 'string', 
                        description: 'Nome da instância que originou o evento',
                        example: 'MainInstance' 
                    },
                    data: { 
                        type: 'object', 
                        description: 'Dados detalhados do evento',
                        properties: {
                            key: {
                                type: 'object',
                                properties: {
                                    remoteJid: { type: 'string', example: '5511999999999@s.whatsapp.net', description: 'ID do contato/grupo' },
                                    fromMe: { type: 'boolean', example: false, description: 'Se a mensagem foi enviada pela própria instância' },
                                    id: { type: 'string', example: 'ABC123XYZ', description: 'ID único da mensagem' }
                                }
                            },
                            pushName: { type: 'string', example: 'João Silva', nullable: true, description: 'Nome do contato no WhatsApp' },
                            message: { type: 'object', additionalProperties: true, description: 'Conteúdo da mensagem (texto, imagem, etc)' }
                        },
                        additionalProperties: true
                    },
                    destination: { type: 'string', description: 'URL de destino do webhook', example: 'http://api:3000/api/webhook/evolution' },
                    date_time: { type: 'string', format: 'date-time', description: 'Data/hora do evento no formato ISO', example: '2026-03-28T22:00:00Z' },
                    sender: { type: 'string', description: 'Número do remetente (JID)', example: '5511999999999@s.whatsapp.net' },
                    server_url: { type: 'string', description: 'URL do servidor Evolution que disparou o evento', example: 'http://evolution:8080' },
                    apikey: { type: 'string', description: 'Chave de API associada à instância', example: 'TEST_API_KEY' }
                },
                required: ['event', 'instance', 'data']
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Confirmação de recebimento',
                    properties: {
                        status: { 
                            type: 'string', 
                            example: 'received',
                            description: 'Informa que o payload foi aceito para processamento' 
                        }
                    }
                },
                500: {
                    type: 'object',
                    description: 'Erro de processamento',
                    properties: {
                        error: { type: 'string', example: 'Webhook processing error', description: 'Mensagem de erro amigável' }
                    }
                }
            }
        });
    }
}
