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
        });

        this.worker.on("failed", (job: Job | undefined, err: Error) => {
            console.error(`[SubscriptionWorker] FAILED job=${job?.name} id=${job?.id} attempt=${job?.attemptsMade} err=${err.message}`, {
                stack: err.stack
            });
        });

        this.worker.on("stalled", (jobId: string) => {
            console.error(`[SubscriptionWorker] STALLED job id=${jobId} — worker may have crashed`);
        });
    }
}
