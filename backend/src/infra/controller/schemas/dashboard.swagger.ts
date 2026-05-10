export const getDashboardStatsSchema = {
    tags: ["Dashboard"],
    summary: "Obtém estatísticas gerais para a dashboard",
    description: "Retorna métricas de confirmações, respostas, taxa de conversão e status do bot.",
    response: {
        200: {
            type: "object" as const,
            required: [
                "totalConfirmations", "managedReplies", "conversionRate",
                "confirmationsChange", "repliesChange", "conversionRateChange",
                "whatsappNumberMissing"
            ],
            properties: {
                totalConfirmations: { type: "number" as const },
                managedReplies: { type: "number" as const },
                conversionRate: { type: "string" as const },
                confirmationsChange: { type: "string" as const },
                repliesChange: { type: "string" as const },
                conversionRateChange: { type: "string" as const },
                whatsappNumberMissing: { type: "boolean" as const },
            }
        }
    }
};
