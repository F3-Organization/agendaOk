import { errorResponse } from "./_common.swagger";

export const connectWhatsappSchema = {
    tags: ["WhatsApp"],
    summary: "Generates a QR Code for WhatsApp connection",
    description: "Creates or retrieves an instance in the Evolution API and returns the Base64 QR Code for pairing.",
    response: {
        200: {
            type: "object" as const,
            properties: {
                instance: { type: "string" as const },
                base64: { type: "string" as const, description: "QR Code image in Base64" },
                code: { type: "string" as const, description: "Pairing code (text)" }
            }
        },
        500: errorResponse("Connection Error")
    }
};

export const getWhatsappStatusSchema = {
    tags: ["WhatsApp"],
    summary: "Gets current WhatsApp connection status",
    description: "Queries the Evolution API to check if the user's instance is connected and returns the state.",
    response: {
        200: {
            type: "object" as const,
            properties: {
                status: { type: "string" as const },
                instanceName: { type: "string" as const, nullable: true }
            }
        }
    }
};

export const disconnectWhatsappSchema = {
    tags: ["WhatsApp"],
    summary: "Removes WhatsApp connection",
    description: "Ends the WhatsApp session and removes the instance linked to the user.",
    response: {
        200: {
            type: "object" as const,
            properties: {
                status: { type: "string" as const, example: "success" },
                message: { type: "string" as const }
            }
        },
        500: errorResponse("Disconnection Error")
    }
};
