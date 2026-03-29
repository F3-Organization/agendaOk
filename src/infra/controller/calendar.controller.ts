import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { SyncCalendarQueue } from "../queue/sync-calendar.queue";
import { NotifyQueue } from "../queue/notify.queue";

export class CalendarController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly syncQueue: SyncCalendarQueue,
        private readonly notifyQueue: NotifyQueue,
        private readonly scheduleRepo: any,
        private readonly subMiddleware?: any
    ) {
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.addProtectedRoute("POST", "/calendar/sync", async (request, reply) => {
            const userId = (request.user as any).id;
            try {
                await this.syncQueue.addSyncJob(userId);
                reply.send({ message: "Synchronization scheduled successfully!", userId });
            } catch (error: any) {
                reply.code(500).send({ error: "Error scheduling synchronization", message: error.message });
            }
        }, {
            tags: ["Calendar"],
            summary: "Syncs Google Calendar events",
            description: "Registers an asynchronous task to fetch the latest events from the user's Google account. Requires JWT Token and Active Subscription.",
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
                reply.send({ message: "Notification scan scheduled!", userId });
            } catch (error: any) {
                reply.code(500).send({ error: "Error scheduling notifications", message: error.message });
            }
        }, {
            tags: ["Calendar"],
            summary: "Triggers WhatsApp notification sending",
            description: "Triggers the check for events in the next 24 hours. Requires JWT Token and Active Subscription.",
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

        this.fastify.addProtectedRoute("GET", "/calendar/appointments", async (request, reply) => {
            const userId = (request.user as any).id;
            try {
                const appointments = await this.scheduleRepo.findByUserId(userId);
                reply.send(appointments);
            } catch (error: any) {
                reply.code(500).send({ error: "Error fetching appointments", message: error.message });
            }
        }, {
            tags: ["Calendar"],
            summary: "Lists user appointments",
            description: "Returns all schedules/appointments synchronized from Google Calendar for the authenticated user.",
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            title: { type: 'string' },
                            status: { type: 'string' },
                            startAt: { type: 'string', format: 'date-time' },
                            endAt: { type: 'string', format: 'date-time' },
                            clientName: { type: 'string' },
                            clientPhone: { type: 'string' }
                        }
                    }
                }
            }
        }, this.subMiddleware);
    }
}
