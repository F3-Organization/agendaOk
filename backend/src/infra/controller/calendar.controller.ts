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
import { z } from "zod";
import {
    syncCalendarSchema,
    notifyCalendarSchema,
    listAppointmentsSchema,
    createAppointmentSchema,
    updateAppointmentSchema,
    deleteAppointmentSchema,
    acceptInviteSchema,
    declineInviteSchema
} from "./schemas/calendar.swagger";

const AppointmentSchema = z.object({
    title: z.string().min(1).max(255),
    clientName: z.string().min(1).max(255),
    clientPhone: z.string().regex(/^\d{10,15}$/, "Phone must be 10-15 digits"),
    startAt: z.coerce.date(),
    endAt: z.coerce.date()
}).refine(d => d.startAt < d.endAt, { message: "endAt must be after startAt", path: ["endAt"] });

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
            const companyId = user.companyId!;

            try {
                await this.syncQueue.addSyncJob(companyId);
                reply.send({ message: "Synchronization scheduled successfully!", companyId });
            } catch (error: any) {
                reply.code(500).send({ error: "Error scheduling synchronization", message: error.message });
            }
        }, syncCalendarSchema);

        this.fastify.addProtectedRoute("POST", "/calendar/notify", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const companyId = user.companyId!;

            try {
                await this.notifyQueue.addNotificationJob(companyId);
                reply.send({ message: "Notification scan scheduled!", companyId });
            } catch (error: any) {
                reply.code(500).send({ error: "Error scheduling notifications", message: error.message });
            }
        }, notifyCalendarSchema, this.subMiddleware);

        this.fastify.addProtectedRoute("GET", "/calendar/appointments", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const companyId = user.companyId!;

            try {
                const appointments = await this.getAppointments.execute(companyId);
                reply.send(appointments);
            } catch (error: any) {
                reply.code(500).send({ error: "Error fetching appointments", message: error.message });
            }
        }, listAppointmentsSchema);

        this.fastify.addProtectedRoute("POST", "/calendar/appointments", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;

            const parseResult = AppointmentSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            const { title, clientName, clientPhone, startAt, endAt } = parseResult.data;

            try {
                const appointment = await this.createAppointment.execute({
                    title,
                    clientName,
                    clientPhone,
                    startAt,
                    endAt,
                    companyId: user.companyId!
                });
                reply.code(201).send(appointment);
            } catch (error: any) {
                request.log.error({ err: error }, "[CalendarController] Create Appointment Error");
                reply.code(400).send({ error: "Erro ao criar agendamento" });
            }
        }, createAppointmentSchema); // Livre para o plano Free (sem this.subMiddleware)

        this.fastify.addProtectedRoute("PUT", "/calendar/appointments/:id", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const { id } = request.params as { id: string };

            const parseResult = AppointmentSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            const { title, clientName, clientPhone, startAt, endAt } = parseResult.data;

            try {
                const appointment = await this.updateAppointment.execute({
                    id,
                    title,
                    clientName,
                    clientPhone,
                    startAt,
                    endAt,
                    companyId: user.companyId!
                });
                reply.send(appointment);
            } catch (error: any) {
                request.log.error({ err: error }, "[CalendarController] Update Appointment Error");
                reply.code(400).send({ error: "Erro ao atualizar agendamento" });
            }
        }, updateAppointmentSchema);

        this.fastify.addProtectedRoute("DELETE", "/calendar/appointments/:id", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const { id } = request.params as { id: string };

            try {
                await this.deleteAppointment.execute(id, user.companyId!);
                reply.code(204).send();
            } catch (error: any) {
                request.log.error({ err: error }, "[CalendarController] Delete Appointment Error");
                reply.code(400).send({ error: "Erro ao deletar agendamento" });
            }
        }, deleteAppointmentSchema);

        this.fastify.addProtectedRoute("PATCH", "/calendar/appointments/:id/accept", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const { id } = request.params as { id: string };

            try {
                await this.acceptInvite.execute(user.companyId!, id);
                reply.send({ message: "Invite accepted successfully" });
            } catch (error: any) {
                request.log.error({ err: error }, "[CalendarController] Accept Invite Error");
                reply.code(400).send({ error: "Erro ao aceitar convite" });
            }
        }, acceptInviteSchema);

        this.fastify.addProtectedRoute("PATCH", "/calendar/appointments/:id/decline", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const { id } = request.params as { id: string };

            try {
                await this.declineInvite.execute(user.companyId!, id);
                reply.send({ message: "Invite declined successfully" });
            } catch (error: any) {
                request.log.error({ err: error }, "[CalendarController] Decline Invite Error");
                reply.code(400).send({ error: "Erro ao recusar convite" });
            }
        }, declineInviteSchema);
    }
}
