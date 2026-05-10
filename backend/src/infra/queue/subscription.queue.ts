import { Queue } from "bullmq";
import { env } from "../config/configs";

export class SubscriptionQueue {
    private queue: Queue;

    constructor() {
        this.queue = new Queue("subscription-checks", {
            connection: {
                host: env.redis.host,
                port: env.redis.port,
                password: env.redis.password
            }
        });

        this.setupRecurringJobs();
    }

    private async setupRecurringJobs() {
        await this.queue.add(
            "check-expired-subscriptions",
            {},
            {
                repeat: { pattern: "0 * * * *" },
                removeOnComplete: true,
                attempts: 2,
                backoff: { type: "exponential", delay: 5000 }
            }
        );
    }
}
