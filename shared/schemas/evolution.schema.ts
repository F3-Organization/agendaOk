import { z } from "zod";

export const EvolutionWebhookSchema = z.object({
    event: z.enum(['messages.upsert', 'messages.update', 'connection.update', 'qrcode.updated']),
    instance: z.string(),
    data: z.object({
        key: z.object({
            remoteJid: z.string(),
            fromMe: z.boolean(),
            id: z.string()
        }).optional(),
        pushName: z.string().nullable().optional(),
        message: z.object({
            conversation: z.string().optional(),
            extendedTextMessage: z.object({
                text: z.string().optional(),
                contextInfo: z.object({
                    stanzaId: z.string().optional(),
                    participant: z.string().optional(),
                    quotedMessage: z.any().optional()
                }).optional()
            }).optional()
        }).passthrough().optional(),
        state: z.string().optional(),
        statusReason: z.number().optional(),
        number: z.string().optional(),
        jid: z.string().optional(),
        worker: z.string().optional()
    }).passthrough(),
    apikey: z.string().optional()
}).passthrough();

export type EvolutionWebhookPayload = z.infer<typeof EvolutionWebhookSchema>;
