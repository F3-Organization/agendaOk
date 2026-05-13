import { errorResponse, messageResponse, uuidParam, validationErrorResponse } from "./_common.swagger";

const appointmentProperties = {
    id: { type: "string" as const, format: "uuid" },
    clientName: { type: "string" as const },
    clientPhone: { type: "string" as const },
    title: { type: "string" as const },
    startAt: { type: "string" as const, format: "date-time" },
    endAt: { type: "string" as const, format: "date-time", nullable: true },
    notes: { type: "string" as const, nullable: true },
    status: { type: "string" as const },
    professionalId: { type: "string" as const, format: "uuid", nullable: true },
};

export const listAppointmentsSchema = {
    tags: ["Appointment"],
    summary: "Lista agendamentos",
    description: "Retorna todos os agendamentos da empresa. Profissionais veem apenas os próprios.",
    response: {
        200: {
            type: "array" as const,
            items: {
                type: "object" as const,
                properties: appointmentProperties,
            },
        },
        400: errorResponse("Company not selected"),
    },
};

export const createAppointmentSchema = {
    tags: ["Appointment"],
    summary: "Cria um agendamento",
    description: "Cria um novo agendamento na empresa selecionada.",
    body: {
        type: "object" as const,
        required: ["clientName", "clientPhone", "title", "startAt"],
        properties: {
            clientName: { type: "string" as const, minLength: 1 },
            clientPhone: { type: "string" as const, minLength: 8 },
            title: { type: "string" as const, minLength: 1 },
            startAt: { type: "string" as const, format: "date-time" },
            endAt: { type: "string" as const, format: "date-time" },
            notes: { type: "string" as const },
            professionalId: { type: "string" as const, format: "uuid" },
        },
    },
    response: {
        201: {
            type: "object" as const,
            properties: appointmentProperties,
        },
        400: validationErrorResponse,
    },
};

export const updateAppointmentSchema = {
    tags: ["Appointment"],
    summary: "Atualiza um agendamento",
    description: "Atualiza os dados de um agendamento existente.",
    params: uuidParam,
    body: {
        type: "object" as const,
        properties: {
            clientName: { type: "string" as const, minLength: 1 },
            clientPhone: { type: "string" as const, minLength: 8 },
            title: { type: "string" as const, minLength: 1 },
            startAt: { type: "string" as const, format: "date-time" },
            endAt: { type: "string" as const, format: "date-time" },
            notes: { type: "string" as const },
            professionalId: { type: "string" as const, format: "uuid" },
            status: { type: "string" as const, enum: ["PENDING", "CONFIRMED", "CANCELLED"] },
        },
    },
    response: {
        200: messageResponse,
        400: validationErrorResponse,
    },
};

export const deleteAppointmentSchema = {
    tags: ["Appointment"],
    summary: "Remove um agendamento",
    description: "Exclui um agendamento existente.",
    params: uuidParam,
    response: {
        204: { type: "null" as const, description: "No content" },
        400: errorResponse("Company not selected"),
    },
};
