export const getDashboardStatsSchema = {
    tags: ["Dashboard"],
    summary: "Obtém estatísticas gerais para a dashboard",
    description: "Retorna métricas de confirmações, respostas, taxa de conversão e status dos agendamentos.",
    response: {
        200: {
            type: "object" as const,
            required: [
                "totalConfirmations", "managedReplies", "conversionRate",
                "confirmationsChange", "repliesChange", "conversionRateChange",
                "calendarConnected"
            ],
            properties: {
                totalConfirmations: { type: "number" as const },
                managedReplies: { type: "number" as const },
                conversionRate: { type: "string" as const },
                confirmationsChange: { type: "string" as const },
                repliesChange: { type: "string" as const },
                conversionRateChange: { type: "string" as const },
                calendarConnected: { type: "boolean" as const },
                whatsappNumberMissing: { type: "boolean" as const },
                appointmentStats: {
                    type: "array" as const,
                    items: {
                        type: "object" as const,
                        properties: {
                            status: { type: "string" as const },
                            count: { type: "number" as const }
                        }
                    }
                }
            }
        }
    }
};
