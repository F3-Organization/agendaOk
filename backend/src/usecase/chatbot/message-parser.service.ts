import { EvolutionWebhookPayload } from "../../../../shared/schemas/evolution.schema";

export interface MessageContext {
    instanceName: string;
    senderNumber: string;
    fullJid: string;
    lid: string;
    messageText: string;
    stanzaId?: string;
    quotedText: string;
}

export class MessageParserService {
    /**
     * Extracts a typed MessageContext from a raw Evolution API webhook payload.
     * Returns null if the payload does not contain a processable message.
     */
    parse(payload: EvolutionWebhookPayload): MessageContext | null {
        const data = payload.data;
        if (!data.key || data.key.fromMe) return null;

        const remoteJid = (data.key?.remoteJid || "") as string;
        const senderJid = (payload.sender || "") as string;

        const lid = remoteJid.includes("@lid") ? remoteJid : "";
        const senderNumber = (senderJid || remoteJid).split("@")[0] || "";
        const fullJid = lid || senderJid || remoteJid;

        if (!lid && !senderNumber) return null;

        const messageText =
            data.message?.extendedTextMessage?.text ||
            data.message?.conversation ||
            "";

        const stanzaId = data.message?.extendedTextMessage?.contextInfo?.stanzaId;

        const quotedText =
            (payload?.data?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
                payload?.data?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text ||
                "") as string;

        return {
            instanceName: payload.instance,
            senderNumber,
            fullJid,
            lid,
            messageText,
            stanzaId,
            quotedText,
        };
    }
}
