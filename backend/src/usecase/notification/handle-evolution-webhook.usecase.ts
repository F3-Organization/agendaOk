import { EvolutionWebhookPayload } from "../../../../shared/schemas/evolution.schema";
import { env } from "../../infra/config/configs";
import { MessageParserService } from "../chatbot/message-parser.service";
import { ConnectionUpdateHandler } from "../chatbot/handlers/connection-update.handler";
import { UserMessageHandler } from "../chatbot/handlers/user-message.handler";
import { SystemBotHandler } from "../chatbot/handlers/system-bot.handler";

export class HandleEvolutionWebhookUseCase {
    constructor(
        private readonly messageParser: MessageParserService,
        private readonly connectionHandler: ConnectionUpdateHandler,
        private readonly userMessageHandler: UserMessageHandler,
        private readonly systemBotHandler: SystemBotHandler
    ) {}

    async execute(payload: EvolutionWebhookPayload): Promise<void> {
        const instanceName = payload.instance;
        if (!instanceName) return;

        // Handle connection update events
        if (payload.event === "connection.update") {
            await this.connectionHandler.handle(instanceName, payload.data);
            return;
        }

        // Only process message upsert events
        if (payload.event !== "messages.upsert") return;

        // Parse the raw payload into a typed context
        const ctx = this.messageParser.parse(payload);
        if (!ctx) return;

        // Route to the appropriate handler
        if (instanceName === env.evolution.systemBotInstance) {
            await this.systemBotHandler.handle(
                ctx.instanceName,
                ctx.senderNumber,
                ctx.fullJid,
                ctx.messageText,
                ctx.stanzaId,
                ctx.quotedText
            );
            return;
        }

        await this.userMessageHandler.handle(
            ctx.instanceName,
            ctx.senderNumber,
            ctx.fullJid,
            ctx.messageText
        );
    }
}
