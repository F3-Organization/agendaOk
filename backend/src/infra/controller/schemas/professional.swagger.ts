import { errorResponse, messageResponse, uuidParam } from "./_common.swagger";

const workingHoursResponseSchema = {
    type: "object" as const,
    nullable: true,
    additionalProperties: {
        type: "array" as const,
        items: {
            type: "object" as const,
            properties: {
                start: { type: "string" as const },
                end: { type: "string" as const },
            },
        },
    },
};

export const listProfessionalsSchema = {
    tags: ["Professional"],
    summary: "Lista profissionais da empresa",
    description: "Retorna todos os profissionais cadastrados na empresa selecionada.",
    response: {
        200: {
            type: "array" as const,
            items: {
                type: "object" as const,
                properties: {
                    id: { type: "string" as const, format: "uuid" },
                    name: { type: "string" as const },
                    specialty: { type: "string" as const, nullable: true },
                    active: { type: "boolean" as const },
                    userId: { type: "string" as const, format: "uuid", nullable: true },
                    invitedEmail: { type: "string" as const, nullable: true },
                    appointmentDuration: { type: "number" as const },
                    workingHours: workingHoursResponseSchema,
                }
            }
        },
        400: errorResponse("Company not selected"),
        500: errorResponse("Failed to list professionals")
    }
};

export const createProfessionalSwaggerSchema = {
    tags: ["Professional"],
    summary: "Cria um novo profissional",
    description: "Adiciona um profissional à empresa selecionada.",
    body: {
        type: "object" as const,
        required: ["name"],
        properties: {
            name: { type: "string" as const, minLength: 1 },
            specialty: { type: "string" as const },
            workingHours: { type: "object" as const },
            appointmentDuration: { type: "number" as const, minimum: 5, maximum: 480 }
        }
    },
    response: {
        201: {
            type: "object" as const,
            properties: {
                id: { type: "string" as const, format: "uuid" },
                name: { type: "string" as const },
                specialty: { type: "string" as const, nullable: true }
            }
        },
        400: errorResponse("Failed to create professional")
    }
};

export const updateProfessionalSwaggerSchema = {
    tags: ["Professional"],
    summary: "Atualiza dados de um profissional",
    params: uuidParam,
    body: {
        type: "object" as const,
        properties: {
            name: { type: "string" as const, minLength: 1 },
            specialty: { type: "string" as const },
            workingHours: { type: "object" as const },
            appointmentDuration: { type: "number" as const, minimum: 5, maximum: 480 },
            active: { type: "boolean" as const }
        }
    },
    response: {
        200: messageResponse,
        404: errorResponse("Professional not found"),
        400: errorResponse("Failed to update professional")
    }
};

export const deleteProfessionalSchema = {
    tags: ["Professional"],
    summary: "Remove um profissional",
    params: uuidParam,
    response: {
        200: messageResponse,
        404: errorResponse("Professional not found"),
        400: errorResponse("Failed to delete professional")
    }
};

export const getBotConfigSchema = {
    tags: ["Professional"],
    summary: "Obtém configuração do chatbot",
    description: "Retorna as configurações do bot da empresa selecionada.",
    response: {
        200: {
            type: "object" as const,
            properties: {
                businessType: { type: "string" as const, nullable: true },
                businessDescription: { type: "string" as const, nullable: true },
                botGreeting: { type: "string" as const, nullable: true },
                botInstructions: { type: "string" as const, nullable: true },
                address: { type: "string" as const, nullable: true },
                workingHours: { ...workingHoursResponseSchema },
                servicesOffered: { type: "array" as const, items: { type: "string" as const }, nullable: true },
                botEnabled: { type: "boolean" as const }
            }
        },
        400: errorResponse("Company not selected"),
        500: errorResponse("Failed to get bot config")
    }
};

export const updateBotConfigSwaggerSchema = {
    tags: ["Professional"],
    summary: "Atualiza configuração do chatbot",
    description: "Atualiza as configurações do bot (saudação, instruções, horários, etc.).",
    body: {
        type: "object" as const,
        properties: {
            businessType: { type: "string" as const, nullable: true },
            businessDescription: { type: "string" as const, nullable: true },
            botGreeting: { type: "string" as const, nullable: true },
            botInstructions: { type: "string" as const, nullable: true },
            address: { type: "string" as const, nullable: true },
            workingHours: { type: "object" as const, nullable: true },
            servicesOffered: { type: "array" as const, items: { type: "string" as const }, nullable: true },
            botEnabled: { type: "boolean" as const }
        }
    },
    response: {
        200: messageResponse,
        400: errorResponse("Failed to update bot config")
    }
};
