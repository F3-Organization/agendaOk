import { Queue } from "bullmq";
import { env } from "../config/configs";

export class NotifyQueue {
    private queue: Queue;

    constructor() {
        this.queue = new Queue("appointment-notifications", {
            connection: {
                host: env.redis.host,
                port: env.redis.port,
                password: env.redis.password,
            },
            defaultJobOptions: {
                removeOnComplete: { count: 20 },
                removeOnFail: { count: 100 },
            },
        });

        this.setupRecurringJobs();
    }

    private async setupRecurringJobs() {
        const repeatables = await this.queue.getRepeatableJobs();
        for (const job of repeatables) {
            if (job.name === "notify-upcoming") {
                await this.queue.removeRepeatableByKey(job.key);
            }
        }

        await this.queue.add(
            "notify-upcoming",
            {},
            {
                repeat: { pattern: "*/15 * * * *" },
                removeOnComplete: { count: 5 },
                removeOnFail: { count: 100 },
                attempts: 2,
                backoff: { type: "exponential", delay: 5000 },
            }
        );
    }
}
