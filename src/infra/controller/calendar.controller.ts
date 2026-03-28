import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { SyncCalendarQueue } from "../queue/sync-calendar.queue";
import { NotifyQueue } from "../queue/notify.queue";

export class CalendarController {
    // ID fixo para testes
    private static readonly TEST_USER_ID = "00000000-0000-0000-0000-000000000001";

    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly syncQueue: SyncCalendarQueue,
        private readonly notifyQueue: NotifyQueue
    ) {
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.addRoute("POST", "/calendar/sync", async (request, reply) => {
            try {
                await this.syncQueue.addSyncJob(CalendarController.TEST_USER_ID);
                reply.send({ message: "Sincronização agendada com sucesso!", userId: CalendarController.TEST_USER_ID });
            } catch (error: any) {
                reply.code(500).send({ error: "Erro ao agendar sincronização", message: error.message });
            }
        }, {
            tags: ["Calendar"],
            summary: "Sincroniza eventos do Google Calendar",
            description: "Registra uma tarefa assíncrona para buscar os eventos mais recentes da conta Google do usuário e sincronizar com o banco de dados local.",
            body: {
                type: 'object',
                description: 'Este endpoint não requer corpo de mensagem.',
                properties: {}
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Sincronização agendada',
                    properties: {
                        message: { 
                            type: 'string', 
                            example: 'Sincronização agendada com sucesso!',
                            description: 'Status do agendamento' 
                        },
                        userId: { 
                            type: 'string', 
                            format: 'uuid', 
                            example: '00000000-0000-0000-0000-000000000001',
                            description: 'ID do usuário que terá os eventos sincronizados' 
                        }
                    }
                },
                500: {
                    type: 'object',
                    description: 'Erro no agendamento',
                    properties: {
                        error: { 
                            type: 'string', 
                            example: 'Erro ao agendar sincronização',
                            description: 'Categoria do erro'
                        },
                        message: { 
                            type: 'string', 
                            example: 'Queue connection failed',
                            description: 'Detalhe técnico' 
                        }
                    }
                }
            }
        });

        this.fastify.addRoute("POST", "/calendar/notify", async (request, reply) => {
            try {
                await this.notifyQueue.addNotificationJob(CalendarController.TEST_USER_ID);
                reply.send({ message: "Varridura de notificações agendada!", userId: CalendarController.TEST_USER_ID });
            } catch (error: any) {
                reply.code(500).send({ error: "Erro ao agendar notificações", message: error.message });
            }
        }, {
            tags: ["Calendar"],
            summary: "Dispara envio de notificações WhatsApp",
            description: "Aciona a verificação de eventos nas próximas 24 horas e coloca os lembretes de notificação na fila do WhatsApp.",
            body: {
                type: 'object',
                description: 'Este endpoint não requer corpo de mensagem.',
                properties: {}
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Notificação agendada',
                    properties: {
                        message: { 
                            type: 'string', 
                            example: 'Varridura de notificações agendada!',
                            description: 'Status do processo' 
                        },
                        userId: { 
                            type: 'string', 
                            format: 'uuid', 
                            example: '00000000-0000-0000-0000-000000000001',
                            description: 'Usuário afetado' 
                        }
                    }
                },
                500: {
                    type: 'object',
                    description: 'Erro operacional',
                    properties: {
                        error: { type: 'string', example: 'Erro ao agendar notificações' },
                        message: { type: 'string', example: 'Database connection timeout' }
                    }
                }
            }
        });
    }
}
