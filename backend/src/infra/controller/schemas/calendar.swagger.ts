import { errorResponse, messageResponse, uuidParam } from "./_common.swagger";

const jobScheduledResponse = {
    type: "object" as const,
    properties: {
        message: { type: "string" as const },
        companyId: { type: "string" as const, format: "uuid" }
    }
};

const appointmentProperties = {
    id: { type: "string" as const },
    title: { type: "string" as const },
    status: { type: "string" as const },
    startAt: { type: "string" as const, format: "date-time" },
    endAt: { type: "string" as const, format: "date-time" },
    clientName: { type: "string" as const },
    clientPhone: { type: "string" as const },
    attendees: {
        type: "array" as const,
        items: {
            type: "object" as const,
            properties: {
                email: { type: "string" as const },
                displayName: { type: "string" as const },
                responseStatus: { type: "string" as const }
            }
        }
    }
};

const appointmentBody = {
    type: "object" as const,
    required: ["title", "clientName", "clientPhone", "startAt", "endAt"],
    properties: {
        title: { type: "string" as const, minLength: 1 },
        clientName: { type: "string" as const, minLength: 1 },
        clientPhone: { type: "string" as const, pattern: "^\\d{10,15}$" },
        startAt: { type: "string" as const, format: "date-time" },
        endAt: { type: "string" as const, format: "date-time" }
    }
};

export const syncCalendarSchema = {
    tags: ["Calendar"],
    summary: "Syncs Google Calendar events",
    description: "Registers an asynchronous task to fetch the latest events from the user's Google account. Requires JWT Token and Active Subscription.",
    response: {
        200: jobScheduledResponse,
        500: errorResponse("Error scheduling synchronization")
    }
};

export const notifyCalendarSchema = {
    tags: ["Calendar"],
    summary: "Triggers WhatsApp notification sending",
    description: "Triggers the check for events in the next 24 hours. Requires JWT Token and Active Subscription.",
    response: {
        200: jobScheduledResponse,
        500: errorResponse("Error scheduling notifications")
    }
};

export const listAppointmentsSchema = {
    tags: ["Calendar"],
    summary: "Lists user appointments",
    description: "Returns all schedules/appointments synchronized from Google Calendar for the authenticated user.",
    response: {
        200: {
            type: "array" as const,
            items: { type: "object" as const, properties: appointmentProperties }
        },
        500: errorResponse("Error fetching appointments")
    }
};

export const createAppointmentSchema = {
    tags: ["Calendar"],
    summary: "Cria um novo agendamento sincronizado com Google Calendar",
    body: appointmentBody,
    response: {
        201: { type: "object" as const, properties: appointmentProperties },
        400: errorResponse("Erro ao criar agendamento")
    }
};

export const updateAppointmentSchema = {
    tags: ["Calendar"],
    summary: "Atualiza um agendamento",
    params: uuidParam,
    body: appointmentBody,
    response: {
        200: { type: "object" as const, properties: appointmentProperties },
        400: errorResponse("Erro ao atualizar agendamento")
    }
};

export const deleteAppointmentSchema = {
    tags: ["Calendar"],
    summary: "Deleta um agendamento",
    params: uuidParam,
    response: {
        204: { type: "null" as const, description: "Appointment deleted" },
        400: errorResponse("Erro ao deletar agendamento")
    }
};

export const acceptInviteSchema = {
    tags: ["Calendar"],
    summary: "Aceita um convite de agendamento em que o usuário não é dono",
    params: uuidParam,
    response: {
        200: messageResponse,
        400: errorResponse("Erro ao aceitar convite")
    }
};

export const declineInviteSchema = {
    tags: ["Calendar"],
    summary: "Recusa um convite de agendamento em que o usuário não é dono",
    params: uuidParam,
    response: {
        200: messageResponse,
        400: errorResponse("Erro ao recusar convite")
    }
};
