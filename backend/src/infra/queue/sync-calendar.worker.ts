import { Worker, Job } from "bullmq";
import { env } from "../config/configs";
import { SyncCalendarUseCase } from "../../usecase/calendar/sync-calendar.usecase";

export class SyncCalendarWorker {
    private worker: Worker;

    constructor(private readonly syncUseCase: SyncCalendarUseCase) {
        this.worker = new Worker(
            "sync-calendar",
            async (job: Job) => {
                const { companyId } = job.data;
                await this.syncUseCase.execute(companyId);
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
            console.log(`[Worker] Sync completed for job ${job.id}`);
        });

        this.worker.on("failed", (job: Job | undefined, err: Error) => {
            console.error(`[Worker] Sync failed for job ${job?.id}: ${err.message}`);
        });
    }
}
