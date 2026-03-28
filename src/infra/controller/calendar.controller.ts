import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { SyncCalendarQueue } from "../queue/sync-calendar.queue";
import { NotifyQueue } from "../queue/notify.queue";

export class CalendarController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly syncQueue: SyncCalendarQueue,
        private readonly notifyQueue: NotifyQueue,
        private readonly subMiddleware?: any
    ) {
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.addProtectedRoute("POST", "/calendar/sync", async (request, reply) => {
            const userId = (request.user as any).id;
            try {
                await this.syncQueue.addSyncJob(userId);
                reply.send({ message: "Sincronização agendada com sucesso!", userId });
            } catch (error: any) {
                reply.code(500).send({ error: "Erro ao agendar sincronização", message: error.message });
            }
        }, {
            tags: ["Calendar"],
            summary: "Sincroniza eventos do Google Calendar",
            description: "Registra uma tarefa assíncrona para buscar os eventos mais recentes da conta Google do usuário. Requer Token JWT e Assinatura Ativa.",
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        userId: { type: 'string', format: 'uuid' }
                    }
                }
            }
        }, this.subMiddleware);

        this.fastify.addProtectedRoute("POST", "/calendar/notify", async (request, reply) => {
            const userId = (request.user as any).id;
            try {
                await this.notifyQueue.addNotificationJob(userId);
                reply.send({ message: "Varridura de notificações agendada!", userId });
            } catch (error: any) {
                reply.code(500).send({ error: "Erro ao agendar notificações", message: error.message });
            }
        }, {
            tags: ["Calendar"],
            summary: "Dispara envio de notificações WhatsApp",
            description: "Aciona a verificação de eventos nas próximas 24 horas. Requer Token JWT e Assinatura Ativa.",
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        userId: { type: 'string', format: 'uuid' }
                    }
                }
            }
        }, this.subMiddleware);
    }
}
