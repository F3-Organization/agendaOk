// ── Swagger helpers reutilizáveis ─────────────────────────────────────

export const errorResponse = (description = "Erro") => ({
    type: "object" as const,
    description,
    properties: {
        error: { type: "string" as const },
        message: { type: "string" as const }
    }
});

export const validationErrorResponse = {
    type: "object" as const,
    description: "Validation failed",
    properties: {
        error: { type: "string" as const },
        details: { type: "object" as const }
    }
};

export const messageResponse = {
    type: "object" as const,
    properties: {
        message: { type: "string" as const }
    }
};

export const paginationProperties = {
    page: { type: "number" as const },
    limit: { type: "number" as const },
    total: { type: "number" as const },
    totalPages: { type: "number" as const }
};

export const uuidParam = {
    type: "object" as const,
    required: ["id"] as const,
    properties: {
        id: { type: "string" as const, format: "uuid" }
    }
};

export const userSummaryProperties = {
    id: { type: "string" as const },
    name: { type: "string" as const },
    email: { type: "string" as const },
    role: { type: "string" as const }
};

export const authResponseProperties = {
    message: { type: "string" as const },
    token: { type: "string" as const },
    user: {
        type: "object" as const,
        properties: {
            ...userSummaryProperties,
            hasPassword: { type: "boolean" as const },
            companyId: { type: "string" as const }
        }
    },
    status: { type: "string" as const },
    tempToken: { type: "string" as const },
    companies: {
        type: "array" as const,
        items: {
            type: "object" as const,
            properties: {
                id: { type: "string" as const },
                name: { type: "string" as const }
            }
        }
    }
};

export const searchPaginationQuery = {
    type: "object" as const,
    properties: {
        search: { type: "string" as const, description: "Busca por nome ou email" },
        page: { type: "number" as const, default: 1 },
        limit: { type: "number" as const, default: 20, maximum: 50 }
    }
};
