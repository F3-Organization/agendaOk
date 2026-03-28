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
            description: "Adiciona uma tarefa na fila para buscar eventos do Google e salvar no banco de dados local.",
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        userId: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
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
            description: "Adiciona uma tarefa na fila para verificar agendamentos nas próximas 24h e enviar lembretes via WhatsApp.",
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        userId: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        });
    }
}
