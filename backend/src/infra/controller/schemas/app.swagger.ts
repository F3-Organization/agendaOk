export const healthCheckSchema = {
    tags: ["System"],
    summary: "Comprehensive health check of the API and its dependencies.",
    description: "Check the status of the Database, Redis, Evolution API, and system metrics.",
    response: {
        200: {
            type: "object" as const,
            properties: {
                status: { type: "string" as const, example: "ok" },
                timestamp: { type: "string" as const, format: "date-time" },
                responseTime: { type: "string" as const, example: "45.20ms" },
                services: {
                    type: "object" as const,
                    properties: {
                        database: { type: "string" as const },
                        redis: { type: "string" as const },
                        evolutionApi: { type: "string" as const }
                    }
                },
                system: {
                    type: "object" as const,
                    properties: {
                        uptime: { type: "number" as const },
                        memory: {
                            type: "object" as const,
                            properties: {
                                heapUsed: { type: "string" as const },
                                heapTotal: { type: "string" as const },
                                rss: { type: "string" as const }
                            }
                        },
                        nodeVersion: { type: "string" as const },
                        platform: { type: "string" as const }
                    }
                }
            }
        },
        503: {
            description: "Service Unavailable",
            type: "object" as const,
            properties: {
                status: { type: "string" as const, example: "error" }
            }
        }
    }
};
