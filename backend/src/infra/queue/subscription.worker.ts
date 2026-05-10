import { Worker, Job } from "bullmq";
import { env } from "../config/configs";
import { CheckExpiredSubscriptionsUseCase } from "../../usecase/subscription/check-expired-subscriptions.usecase";

export class SubscriptionWorker {
    private worker: Worker;

    constructor(
        private readonly checkExpiredUseCase: CheckExpiredSubscriptionsUseCase
    ) {
        this.worker = new Worker(
            "subscription-checks",
            async (job: Job) => {
                if (job.name === "check-expired-subscriptions") {
                    const result = await this.checkExpiredUseCase.execute();
                    console.log(`[SubscriptionWorker] Checked expired subscriptions: ${result.processed} processed.`);
                }
            },
            {
                connection: {
                    host: env.redis.host,
                    port: env.redis.port,
                    password: env.redis.password
                }
            }
        );

        this.worker.on("completed", (job: Job) => {
            console.log(`[SubscriptionWorker] Job ${job.name} (${job.id}) completed`);
        });

        this.worker.on("failed", (job: Job | undefined, err: Error) => {
            console.error(`[SubscriptionWorker] Job ${job?.name} (${job?.id}) failed: ${err.message}`);
        });
    }
}
