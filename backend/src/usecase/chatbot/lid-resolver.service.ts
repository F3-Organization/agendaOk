import { IEvolutionService } from "../ports/ievolution-service";
import { RedisService } from "../../infra/database/redis.service";

const LID_CACHE_PREFIX = "lid:";
const LID_CACHE_TTL = 60 * 60 * 24 * 7; // 7 days — LID mappings are persistent

/**
 * Resolves LID-based JIDs (e.g., "272876905177267@lid") to real phone numbers
 * by querying the Evolution API contacts endpoint and caching the result in Redis.
 */
export class LidResolverService {
    constructor(
        private readonly evolutionService: IEvolutionService,
        private readonly redisService: RedisService
    ) {}

    /**
     * Given a LID JID, resolves it to the real phone number.
     * Returns the phone number (digits only) or null if resolution fails.
     */
    async resolve(instanceName: string, lidJid: string): Promise<string | null> {
        if (!lidJid.includes("@lid")) {
            // Not a LID — extract number directly
            const num = lidJid.split("@")[0].replace(/\D/g, "");
            return num || null;
        }

        const lidKey = lidJid.split("@")[0];

        // Check cache first
        const cached = await this.getFromCache(lidKey);
        if (cached) return cached;

        // Query Evolution API to resolve LID → phone number
        try {
            const contact = await this.evolutionService.findContacts(instanceName, lidJid);
            if (contact) {
                // The contact.id should be the real JID (number@s.whatsapp.net)
                const realJid = contact.id || "";
                let phoneNumber: string | null = null;

                if (contact.number) {
                    phoneNumber = contact.number.replace(/\D/g, "");
                } else if (realJid.includes("@s.whatsapp.net")) {
                    phoneNumber = realJid.split("@")[0].replace(/\D/g, "");
                } else if (realJid && !realJid.includes("@lid")) {
                    phoneNumber = realJid.split("@")[0].replace(/\D/g, "");
                }

                if (phoneNumber && phoneNumber.length >= 10) {
                    await this.saveToCache(lidKey, phoneNumber);
                    return phoneNumber;
                }
            }
        } catch (error) {
            console.error(`[LidResolverService] Failed to resolve LID ${lidJid}:`, error);
        }

        return null;
    }

    private async getFromCache(lidKey: string): Promise<string | null> {
        try {
            return await this.redisService.get(`${LID_CACHE_PREFIX}${lidKey}`);
        } catch {
            return null;
        }
    }

    private async saveToCache(lidKey: string, phoneNumber: string): Promise<void> {
        try {
            await this.redisService.set(`${LID_CACHE_PREFIX}${lidKey}`, phoneNumber, LID_CACHE_TTL);
        } catch {
            // Cache failure is non-critical
        }
    }
}
