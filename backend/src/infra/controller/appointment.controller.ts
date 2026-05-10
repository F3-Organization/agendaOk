import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { GetAppointmentsUseCase } from "../../usecase/appointment/get-appointments.usecase";
import { CreateAppointmentUseCase } from "../../usecase/appointment/create-appointment.usecase";
import { UpdateAppointmentUseCase } from "../../usecase/appointment/update-appointment.usecase";
import { DeleteAppointmentUseCase } from "../../usecase/appointment/delete-appointment.usecase";
import { AuthUserPayload } from "../types/auth.types";
import { ScheduleStatus } from "../database/entities/schedule.entity";

const AppointmentBodySchema = z.object({
    clientName: z.string().min(1),
    clientPhone: z.string().min(8),
    title: z.string().min(1),
    startAt: z.string().datetime(),
    endAt: z.string().datetime().optional(),
    notes: z.string().optional(),
});

export class AppointmentController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly getAppointments: GetAppointmentsUseCase,
        private readonly createAppointment: CreateAppointmentUseCase,
        private readonly updateAppointment: UpdateAppointmentUseCase,
        private readonly deleteAppointment: DeleteAppointmentUseCase
    ) {
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.addProtectedRoute(
            "GET",
            "/appointments",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const user = request.user as AuthUserPayload;
                if (!user.companyId) return reply.code(400).send({ error: "No company selected" });
                const appointments = await this.getAppointments.execute(user.companyId);
                return reply.send(appointments);
            }
        );

        this.fastify.addProtectedRoute(
            "POST",
            "/appointments",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const user = request.user as AuthUserPayload;
                if (!user.companyId) return reply.code(400).send({ error: "No company selected" });

                const parseResult = AppointmentBodySchema.safeParse(request.body);
                if (!parseResult.success) {
                    return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
                }

                const { clientName, clientPhone, title, startAt, endAt, notes } = parseResult.data;
                const appointment = await this.createAppointment.execute({
                    companyId: user.companyId,
                    clientName,
                    clientPhone,
                    title,
                    startAt: new Date(startAt),
                    endAt: endAt ? new Date(endAt) : undefined,
                    notes,
                });
                return reply.code(201).send(appointment);
            }
        );

        this.fastify.addProtectedRoute(
            "PATCH",
            "/appointments/:id",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const user = request.user as AuthUserPayload;
                if (!user.companyId) return reply.code(400).send({ error: "No company selected" });

                const { id } = request.params as { id: string };
                const schema = AppointmentBodySchema.partial().extend({
                    status: z.nativeEnum(ScheduleStatus).optional(),
                });

                const parseResult = schema.safeParse(request.body);
                if (!parseResult.success) {
                    return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
                }

                const data = parseResult.data;
                await this.updateAppointment.execute(id, user.companyId, {
                    ...data,
                    startAt: data.startAt ? new Date(data.startAt) : undefined,
                    endAt: data.endAt ? new Date(data.endAt) : undefined,
                });
                return reply.send({ message: "Appointment updated" });
            }
        );

        this.fastify.addProtectedRoute(
            "DELETE",
            "/appointments/:id",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const user = request.user as AuthUserPayload;
                if (!user.companyId) return reply.code(400).send({ error: "No company selected" });

                const { id } = request.params as { id: string };
                await this.deleteAppointment.execute(id, user.companyId);
                return reply.code(204).send();
            }
        );
    }
}
