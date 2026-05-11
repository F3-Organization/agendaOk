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
    professionalId: z.string().uuid().optional(),
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

                const professionalId = user.role === "PROFESSIONAL" ? user.professionalId : undefined;
                const appointments = await this.getAppointments.execute(user.companyId, professionalId);
                return reply.send(appointments);
            }
        );

        this.fastify.addProtectedRoute(
            "POST",
            "/appointments",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const user = request.user as AuthUserPayload;
                if (!user.companyId) return reply.code(400).send({ error: "No company selected" });
                if (user.role === "PROFESSIONAL") return reply.code(403).send({ error: "Professionals cannot create appointments" });

                const parseResult = AppointmentBodySchema.safeParse(request.body);
                if (!parseResult.success) {
                    return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
                }

                const { clientName, clientPhone, title, startAt, endAt, notes, professionalId } = parseResult.data;
                const appointment = await this.createAppointment.execute({
                    companyId: user.companyId,
                    clientName,
                    clientPhone,
                    title,
                    startAt: new Date(startAt),
                    ...(endAt ? { endAt: new Date(endAt) } : {}),
                    ...(notes ? { notes } : {}),
                    ...(professionalId ? { professionalId } : {}),
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
                if (user.role === "PROFESSIONAL") return reply.code(403).send({ error: "Professionals cannot edit appointments" });

                const { id } = request.params as { id: string };
                const schema = AppointmentBodySchema.partial().extend({
                    status: z.nativeEnum(ScheduleStatus).optional(),
                });

                const parseResult = schema.safeParse(request.body);
                if (!parseResult.success) {
                    return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
                }

                const { startAt: rawStart, endAt: rawEnd, professionalId: pid, ...rest } = parseResult.data;
                const updateData: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(rest)) if (v !== undefined) updateData[k] = v;
                if (rawStart) updateData.startAt = new Date(rawStart);
                if (rawEnd) updateData.endAt = new Date(rawEnd);
                if (pid) updateData.professionalId = pid;
                await this.updateAppointment.execute(id, user.companyId, updateData as any);
                return reply.send({ message: "Appointment updated" });
            }
        );

        this.fastify.addProtectedRoute(
            "DELETE",
            "/appointments/:id",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const user = request.user as AuthUserPayload;
                if (!user.companyId) return reply.code(400).send({ error: "No company selected" });
                if (user.role === "PROFESSIONAL") return reply.code(403).send({ error: "Professionals cannot delete appointments" });

                const { id } = request.params as { id: string };
                await this.deleteAppointment.execute(id, user.companyId);
                return reply.code(204).send();
            }
        );
    }
}
