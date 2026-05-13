export class PhoneNormalizerService {
    /**
     * Strips all non-digit characters from the given number string.
     */
    normalize(number: string): string {
        return number.replace(/\D/g, "");
    }

    /**
     * Extracts the raw phone number from a WhatsApp JID.
     * For example, "5511999999999@s.whatsapp.net" → "5511999999999".
     * Returns null if the JID does not contain a valid numeric prefix.
     */
    extractFromJid(jid: string): string | null {
        if (!jid || !jid.includes("@")) return null;
        const numberPart = jid.split("@")[0];
        if (numberPart && /^\d+$/.test(numberPart)) {
            return this.normalize(numberPart);
        }
        return null;
    }
}
