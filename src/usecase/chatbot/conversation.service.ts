import { RedisService } from "../../infra/database/redis.service";
import { ChatMessage } from "../../infra/adapters/gemini.adapter";

const CONVERSATION_TTL = 30 * 60; // 30 minutes
const MAX_MESSAGES = 20;

export class ConversationService {
    constructor(private readonly redis: RedisService) {}

    private getKey(companyId: string, phoneNumber: string): string {
        return `chat:${companyId}:${phoneNumber}`;
    }

    async getHistory(companyId: string, phoneNumber: string): Promise<ChatMessage[]> {
        const key = this.getKey(companyId, phoneNumber);
        const data = await this.redis.get(key);

        if (!data) return [];

        try {
            return JSON.parse(data) as ChatMessage[];
        } catch {
            return [];
        }
    }

    async addMessages(
        companyId: string,
        phoneNumber: string,
        userMessage: string,
        botResponse: string
    ): Promise<void> {
        const key = this.getKey(companyId, phoneNumber);
        const history = await this.getHistory(companyId, phoneNumber);

        history.push(
            { role: "user", parts: [{ text: userMessage }] },
            { role: "model", parts: [{ text: botResponse }] }
        );

        // Keep only the last MAX_MESSAGES messages
        const trimmed = history.slice(-MAX_MESSAGES);

        await this.redis.set(key, JSON.stringify(trimmed), CONVERSATION_TTL);
    }

    async clearHistory(companyId: string, phoneNumber: string): Promise<void> {
        const key = this.getKey(companyId, phoneNumber);
        await this.redis.del(key);
    }
}
