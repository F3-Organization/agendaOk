import { Queue } from "bullmq";
import { env } from "../config/configs";

export class SyncCalendarQueue {
    private queue: Queue;

    constructor() {
        this.queue = new Queue("sync-calendar", {
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
    }

    async addSyncJob(companyId: string): Promise<void> {
        await this.queue.add(
            `sync-${companyId}`,
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
