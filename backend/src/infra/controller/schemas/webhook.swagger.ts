import { errorResponse } from "./_common.swagger";

export const evolutionWebhookSchema = {
    tags: ["Webhook"],
    summary: "Receives notifications from the Evolution API",
    description: "Main endpoint for receiving webhooks from the Evolution API.",
    body: {
        type: "object" as const,
        required: ["event", "instance"],
        properties: {
            event: { type: "string" as const },
            instance: { type: "string" as const },
            data: { type: "object" as const },
            sender: { type: "string" as const },
            apikey: { type: "string" as const }
        }
    },
    response: {
        200: { type: "object" as const, properties: { status: { type: "string" as const } } },
        400: errorResponse("Invalid payload"),
        401: errorResponse("Unauthorized webhook call")
    }
};
