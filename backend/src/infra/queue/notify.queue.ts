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
            },
            defaultJobOptions: {
                removeOnComplete: { count: 20 },
                removeOnFail: { count: 100 }
            }
        });

        this.setupRecurringJobs();
    }

    private async setupRecurringJobs() {
        await this.queue.add(
            "check-upcoming-appointments",
            {},
            {
                repeat: { pattern: "*/15 * * * *" },
                removeOnComplete: { count: 5 },
                removeOnFail: { count: 50 },
                attempts: 2,
                backoff: { type: "exponential", delay: 5000 }
            }
        );
    }

    async addNotificationJob(companyId: string): Promise<void> {
        await this.queue.add(
            `notify-${companyId}`,
            { companyId },
            {
                removeOnComplete: { count: 20 },
                removeOnFail: { count: 100 },
                attempts: 3,
                backoff: { type: "exponential", delay: 1000 }
            }
        );
    }
}
