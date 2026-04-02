import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { SyncCalendarQueue } from "../queue/sync-calendar.queue";
import { NotifyQueue } from "../queue/notify.queue";
import { GetAppointmentsUseCase } from "../../usecase/calendar/get-appointments.usecase";
import { CreateAppointmentUseCase } from "../../usecase/calendar/create-appointment.usecase";
import { UpdateAppointmentUseCase } from "../../usecase/calendar/update-appointment.usecase";
import { DeleteAppointmentUseCase } from "../../usecase/calendar/delete-appointment.usecase";
import { AcceptInviteUseCase } from "../../usecase/calendar/accept-invite.usecase";
import { DeclineInviteUseCase } from "../../usecase/calendar/decline-invite.usecase";
import { AuthUserPayload } from "../types/auth.types";

export class CalendarController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly syncQueue: SyncCalendarQueue,
        private readonly notifyQueue: NotifyQueue,
        private readonly getAppointments: GetAppointmentsUseCase,
        private readonly createAppointment: CreateAppointmentUseCase,
        private readonly updateAppointment: UpdateAppointmentUseCase,
        private readonly deleteAppointment: DeleteAppointmentUseCase,
        private readonly acceptInvite: AcceptInviteUseCase,
        private readonly declineInvite: DeclineInviteUseCase,
        private readonly subMiddleware?: any
    ) {
        this.fastify.logInfo("[CalendarController] Initializing and registering routes...");
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.addProtectedRoute("POST", "/calendar/sync", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const userId = user.id;

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
                    type: "object",
                    properties: {
                        message: { type: "string" },
                        userId: { type: "string", format: "uuid" }
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

        });

        this.fastify.addProtectedRoute("POST", "/calendar/notify", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const userId = user.id;

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
                    type: "object",
                    properties: {
                        message: { type: "string" },
                        userId: { type: "string", format: "uuid" }
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

        }, this.subMiddleware);

        this.fastify.addProtectedRoute("GET", "/calendar/appointments", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const userId = user.id;

            try {
                const appointments = await this.getAppointments.execute(userId);
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
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            title: { type: "string" },
                            status: { type: "string" },
                            startAt: { type: "string", format: "date-time" },
                            endAt: { type: "string", format: "date-time" },
                            clientName: { type: "string" },
                            clientPhone: { type: "string" },
                            attendees: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        email: { type: "string" },
                                        displayName: { type: "string" },
                                        responseStatus: { type: "string" }
                                    }
                                }
                            }
                        }
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

        });

        this.fastify.addProtectedRoute("POST", "/calendar/appointments", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const inputData = request.body as any;
            
            try {
                const appointment = await this.createAppointment.execute({
                    title: inputData.title,
                    clientName: inputData.clientName,
                    clientPhone: inputData.clientPhone,
                    startAt: new Date(inputData.startAt),
                    endAt: new Date(inputData.endAt),
                    userId: user.id
                });
                reply.code(201).send(appointment);
            } catch (error: any) {
                console.error("[CalendarController] Create Appointment Error:", error);
                reply.code(400).send({ error: "Erro ao criar agendamento", message: error.message });
            }
        }, {
            tags: ["Calendar"],
            summary: "Cria um novo agendamento sincronizado com Google Calendar",
            body: {
                type: "object",
                required: ["title", "clientName", "clientPhone", "startAt", "endAt"],
                properties: {
                    title: { type: "string", minLength: 1 },
                    clientName: { type: "string", minLength: 1 },
                    clientPhone: { type: "string", pattern: "^\\d{10,15}$" },
                    startAt: { type: "string", format: "date-time" },
                    endAt: { type: "string", format: "date-time" }
                }
            }
        }); // Livre para o plano Free (sem this.subMiddleware)

        this.fastify.addProtectedRoute("PUT", "/calendar/appointments/:id", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const inputData = request.body as any;
            const { id } = request.params as { id: string };
            
            try {
                const appointment = await this.updateAppointment.execute({
                    id,
                    title: inputData.title,
                    clientName: inputData.clientName,
                    clientPhone: inputData.clientPhone,
                    startAt: new Date(inputData.startAt),
                    endAt: new Date(inputData.endAt),
                    userId: user.id
                });
                reply.send(appointment);
            } catch (error: any) {
                console.error("[CalendarController] Update Appointment Error:", error);
                reply.code(400).send({ error: "Erro ao atualizar agendamento", message: error.message });
            }
        }, {
            tags: ["Calendar"],
            summary: "Atualiza um agendamento",
            body: {
                type: "object",
                required: ["title", "clientName", "clientPhone", "startAt", "endAt"],
                properties: {
                    title: { type: "string", minLength: 1 },
                    clientName: { type: "string", minLength: 1 },
                    clientPhone: { type: "string", pattern: "^\\d{10,15}$" },
                    startAt: { type: "string", format: "date-time" },
                    endAt: { type: "string", format: "date-time" }
                }
            }
        });

        this.fastify.addProtectedRoute("DELETE", "/calendar/appointments/:id", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const { id } = request.params as { id: string };

            try {
                await this.deleteAppointment.execute(id, user.id);
                reply.code(204).send();
            } catch (error: any) {
                console.error("[CalendarController] Delete Appointment Error:", error);
                reply.code(400).send({ error: "Erro ao deletar agendamento", message: error.message });
            }
        }, {
            tags: ["Calendar"],
            summary: "Deleta um agendamento",
        });

        this.fastify.addProtectedRoute("PATCH", "/calendar/appointments/:id/accept", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const { id } = request.params as { id: string };

            try {
                await this.acceptInvite.execute(user.id, id);
                reply.send({ message: "Invite accepted successfully" });
            } catch (error: any) {
                console.error("[CalendarController] Accept Invite Error:", error);
                reply.code(400).send({ error: "Erro ao aceitar convite", message: error.message });
            }
        }, {
            tags: ["Calendar"],
            summary: "Aceita um convite de agendamento em que o usuário não é dono",
        });

        this.fastify.addProtectedRoute("PATCH", "/calendar/appointments/:id/decline", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const { id } = request.params as { id: string };

            try {
                await this.declineInvite.execute(user.id, id);
                reply.send({ message: "Invite declined successfully" });
            } catch (error: any) {
                console.error("[CalendarController] Decline Invite Error:", error);
                reply.code(400).send({ error: "Erro ao recusar convite", message: error.message });
            }
        }, {
            tags: ["Calendar"],
            summary: "Recusa um convite de agendamento em que o usuário não é dono",
        });
    }
}
