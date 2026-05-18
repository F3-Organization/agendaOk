import { EvolutionWebhookPayload } from "../../../../shared/schemas/evolution.schema";

export interface MessageContext {
    instanceName: string;
    senderNumber: string;
    fullJid: string;
    lid: string;
    messageText: string;
    mediaType: "text" | "audio" | "image" | "video" | "document" | "sticker" | "unsupported";
    stanzaId?: string;
    quotedText: string;
}

export class MessageParserService {
    /**
     * Extracts a typed MessageContext from a raw Evolution API webhook payload.
     * Returns null if the payload does not contain a processable message.
     */
    parse(payload: EvolutionWebhookPayload): MessageContext | null {
        const data = payload.data as Record<string, any>;
        if (!data.key || data.key.fromMe) return null;

        const remoteJid = (data.key?.remoteJid || "") as string;
        const fullJid = remoteJid;
        const lid = remoteJid.includes("@lid") ? remoteJid : "";

        // In Evolution API, data.sender / root sender is the BOT's own number.
        // The CLIENT's number comes from data.key.remoteJid.
        // When remoteJid is a @lid, we try to find the real number in other fields.
        const senderNumber = this.extractSenderNumber(data, remoteJid);

        if (!lid && !senderNumber) return null;

        const messageText =
            data.message?.extendedTextMessage?.text ||
            data.message?.conversation ||
            data.message?.imageMessage?.caption ||
            data.message?.videoMessage?.caption ||
            "";

        const mediaType = this.detectMediaType(data.message);

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
            mediaType,
            stanzaId,
            quotedText,
        };
    }

    /**
     * Extracts the real phone number of the CLIENT from the webhook payload.
     *
     * IMPORTANT: In Evolution API v2.3.7:
     * - data.sender = the BOT's own WhatsApp number (instance number) — DO NOT use for client identification
     * - data.key.remoteJid = the CLIENT's JID (may be @s.whatsapp.net or @lid)
     * - data.key.participant = used in groups, the actual sender within the group
     */
    private extractSenderNumber(data: Record<string, any>, remoteJid: string): string {
        // Priority 1: remoteJid when it's a regular phone-based JID
        if (remoteJid && !remoteJid.includes("@lid") && !remoteJid.includes("@g.us")) {
            return remoteJid.split("@")[0].replace(/\D/g, "");
        }

        // Priority 2: In group chats, participant has the actual sender
        if (data.key?.participant && !String(data.key.participant).includes("@lid")) {
            return String(data.key.participant).split("@")[0].replace(/\D/g, "");
        }

        // Priority 3: data.senderPn — may contain the phone number when LID is used
        if (data.senderPn) {
            return String(data.senderPn).split("@")[0].replace(/\D/g, "");
        }

        // Priority 4: data.number — sometimes Evolution includes the plain number
        if (data.number) {
            return String(data.number).replace(/\D/g, "");
        }

        // Last resort: return the LID identifier (opaque, but allows conversation tracking)
        if (remoteJid.includes("@lid")) {
            return remoteJid.split("@")[0] || "";
        }

        return remoteJid.split("@")[0].replace(/\D/g, "") || "";
    }

    private detectMediaType(message: Record<string, any> | undefined): MessageContext["mediaType"] {
        if (!message) return "text";
        if (message.audioMessage) return "audio";
        if (message.imageMessage) return "image";
        if (message.videoMessage) return "video";
        if (message.documentMessage || message.documentWithCaptionMessage) return "document";
        if (message.stickerMessage) return "sticker";
        if (message.conversation || message.extendedTextMessage) return "text";
        return "unsupported";
    }
}

