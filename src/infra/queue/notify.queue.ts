import { Queue } from "bullmq";
import { env } from "../config/configs";

export class NotifyQueue {
    private queue: Queue;

    constructor() {
        this.queue = new Queue("notifications", {
            connection: {
                host: env.redis.host,
                port: env.redis.port,
                password: env.redis.password
            }
        });

        // Configura o job recorrente para rodar a cada 30 minutos
        this.setupRecurringJobs();
    }

    private async setupRecurringJobs() {
        await this.queue.add(
            "check-upcoming-appointments",
            {},
            {
                repeat: { pattern: "*/30 * * * *" }, // Cron para a cada 30min
                removeOnComplete: true,
                attempts: 1
            }
        );
    }

    async addNotificationJob(companyId: string): Promise<void> {
        await this.queue.add(
            `notify-${companyId}`,
            { companyId },
            {
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: "exponential", delay: 1000 }
            }
        );
    }
}
