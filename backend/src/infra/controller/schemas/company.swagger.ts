import { errorResponse, messageResponse, uuidParam } from "./_common.swagger";

const companyProperties = {
    id: { type: "string" as const, format: "uuid" },
    name: { type: "string" as const },
    slug: { type: "string" as const },
    createdAt: { type: "string" as const, format: "date-time" }
};

export const listCompaniesSchema = {
    tags: ["Company"],
    summary: "Lista as empresas do usuário",
    description: "Retorna todas as empresas que o usuário autenticado possui.",
    response: {
        200: {
            type: "array" as const,
            items: { type: "object" as const, properties: companyProperties }
        },
        500: errorResponse("Failed to list companies")
    }
};

export const createCompanySchema = {
    tags: ["Company"],
    summary: "Cria uma nova empresa",
    description: "Cria uma empresa vinculada ao usuário autenticado.",
    body: {
        type: "object" as const,
        required: ["name"],
        properties: {
            name: { type: "string" as const, minLength: 1 }
        }
    },
    response: {
        201: { type: "object" as const, properties: companyProperties },
        400: errorResponse("Failed to create company")
    }
};

export const selectCompanySchema = {
    tags: ["Company"],
    summary: "Seleciona o contexto de uma empresa",
    description: "Gera um novo token JWT com o companyId selecionado para operar nessa empresa.",
    params: uuidParam,
    response: {
        200: {
            type: "object" as const,
            properties: {
                token: { type: "string" as const },
                company: { type: "object" as const, properties: companyProperties }
            }
        },
        403: errorResponse("Forbidden"),
        404: errorResponse("Company not found")
    }
};

export const updateCompanySchema = {
    tags: ["Company"],
    summary: "Atualiza dados da empresa",
    description: "Atualiza o nome da empresa. O usuário deve ser o dono.",
    params: uuidParam,
    body: {
        type: "object" as const,
        required: ["name"],
        properties: {
            name: { type: "string" as const, minLength: 1 }
        }
    },
    response: {
        200: messageResponse,
        403: errorResponse("Forbidden"),
        404: errorResponse("Company not found")
    }
};

export const deleteCompanySchema = {
    tags: ["Company"],
    summary: "Deleta uma empresa",
    description: "Remove permanentemente a empresa e todos os dados associados. O usuário deve ser o dono.",
    params: uuidParam,
    response: {
        200: messageResponse,
        403: errorResponse("Forbidden"),
        404: errorResponse("Company not found")
    }
};
