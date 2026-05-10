import { errorResponse, messageResponse, uuidParam, searchPaginationQuery, paginationProperties, userSummaryProperties } from "./_common.swagger";

export const adminStatsSchema = {
    tags: ["Admin"],
    summary: "Get admin dashboard statistics",
    description: "Returns aggregated platform metrics: user count, companies, subscriptions, MRR, and daily signups.",
    response: {
        200: {
            type: "object" as const,
            properties: {
                totalUsers: { type: "number" as const },
                totalCompanies: { type: "number" as const },
                totalProfessionals: { type: "number" as const },
                totalAppointments: { type: "number" as const },
                subscriptionsByPlan: {
                    type: "array" as const,
                    items: {
                        type: "object" as const,
                        properties: {
                            plan: { type: "string" as const },
                            status: { type: "string" as const },
                            count: { type: "string" as const }
                        }
                    }
                },
                recentUsers: {
                    type: "array" as const,
                    items: {
                        type: "object" as const,
                        properties: {
                            date: { type: "string" as const },
                            count: { type: "string" as const }
                        }
                    }
                },
                activeProSubscriptions: { type: "number" as const },
                estimatedMRR: { type: "number" as const }
            }
        }
    }
};

export const adminListUsersSchema = {
    tags: ["Admin"],
    summary: "List all users",
    description: "Paginated list of all users with subscription and company info.",
    querystring: searchPaginationQuery,
    response: {
        200: {
            type: "object" as const,
            properties: {
                users: {
                    type: "array" as const,
                    items: {
                        type: "object" as const,
                        properties: {
                            ...userSummaryProperties,
                            createdAt: { type: "string" as const, format: "date-time" },
                            twoFactorEnabled: { type: "boolean" as const },
                            subscription: {
                                type: "object" as const, nullable: true,
                                properties: { plan: { type: "string" as const }, status: { type: "string" as const } }
                            },
                            companiesCount: { type: "number" as const },
                            companies: { type: "array" as const, items: { type: "object" as const, properties: { id: { type: "string" as const }, name: { type: "string" as const } } } },
                            authMethod: { type: "string" as const, enum: ["google", "email"] }
                        }
                    }
                },
                pagination: { type: "object" as const, properties: paginationProperties }
            }
        }
    }
};

export const adminGetUserSchema = {
    tags: ["Admin"],
    summary: "Get user details",
    params: uuidParam,
    response: {
        200: {
            type: "object" as const,
            properties: {
                ...userSummaryProperties,
                createdAt: { type: "string" as const, format: "date-time" },
                twoFactorEnabled: { type: "boolean" as const },
                authMethod: { type: "string" as const },
                subscription: { type: "object" as const, nullable: true },
                companies: { type: "array" as const, items: { type: "object" as const } }
            }
        },
        404: errorResponse("Usuário não encontrado")
    }
};

export const adminUpdateUserSchema = {
    tags: ["Admin"],
    summary: "Update user role or plan",
    params: uuidParam,
    body: {
        type: "object" as const,
        properties: {
            role: { type: "string" as const, enum: ["ADMIN", "USER"] },
            plan: { type: "string" as const }
        }
    },
    response: {
        200: { type: "object" as const, properties: { success: { type: "boolean" as const } } },
        404: errorResponse("Usuário não encontrado")
    }
};

export const adminImpersonateSchema = {
    tags: ["Admin"],
    summary: "Impersonate a user",
    description: "Generates a JWT token for the target user, allowing the admin to act as that user.",
    params: uuidParam,
    response: {
        200: {
            type: "object" as const,
            properties: {
                token: { type: "string" as const },
                user: { type: "object" as const, properties: userSummaryProperties },
                companies: { type: "array" as const, items: { type: "object" as const, properties: { id: { type: "string" as const }, name: { type: "string" as const } } } }
            }
        },
        404: errorResponse("Usuário não encontrado")
    }
};

export const adminListCompaniesSchema = {
    tags: ["Admin"],
    summary: "List all companies",
    description: "Paginated list of all companies with owner and subscription info.",
    querystring: searchPaginationQuery,
    response: {
        200: {
            type: "object" as const,
            properties: {
                companies: {
                    type: "array" as const,
                    items: {
                        type: "object" as const,
                        properties: {
                            id: { type: "string" as const },
                            name: { type: "string" as const },
                            slug: { type: "string" as const },
                            createdAt: { type: "string" as const, format: "date-time" },
                            owner: { type: "object" as const, properties: { id: { type: "string" as const }, name: { type: "string" as const }, email: { type: "string" as const } } },
                            subscription: { type: "object" as const, nullable: true, properties: { plan: { type: "string" as const }, status: { type: "string" as const } } },
                            professionalsCount: { type: "number" as const }
                        }
                    }
                },
                pagination: { type: "object" as const, properties: paginationProperties }
            }
        }
    }
};

export const adminListPlansSchema = {
    tags: ["Admin"],
    summary: "List all plans",
    response: {
        200: { type: "array" as const, items: { type: "object" as const } }
    }
};

const planBody = {
    type: "object" as const,
    properties: {
        slug: { type: "string" as const },
        name: { type: "string" as const },
        description: { type: "string" as const, nullable: true },
        priceInCents: { type: "number" as const },
        messageLimit: { type: "number" as const, nullable: true },
        maxDevices: { type: "number" as const },
        features: { type: "array" as const, items: { type: "string" as const } },
        isActive: { type: "boolean" as const },
        isPurchasable: { type: "boolean" as const },
        sortOrder: { type: "number" as const }
    }
};

export const adminCreatePlanSchema = {
    tags: ["Admin"],
    summary: "Create a new plan",
    body: { ...planBody, required: ["slug", "name", "priceInCents", "maxDevices", "features", "isActive", "isPurchasable", "sortOrder"] },
    response: {
        201: { type: "object" as const },
        400: errorResponse("Validation failed"),
        409: errorResponse("Plan with this slug already exists")
    }
};

export const adminUpdatePlanSchema = {
    tags: ["Admin"],
    summary: "Update a plan",
    params: uuidParam,
    body: planBody,
    response: {
        200: { type: "object" as const },
        400: errorResponse("Validation failed"),
        404: errorResponse("Plan not found")
    }
};

export const adminDeletePlanSchema = {
    tags: ["Admin"],
    summary: "Delete a plan",
    params: uuidParam,
    response: {
        204: { type: "null" as const, description: "Plan deleted" },
        404: errorResponse("Plan not found")
    }
};
