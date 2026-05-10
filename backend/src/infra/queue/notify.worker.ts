import { Worker, Job } from "bullmq";
import { env } from "../config/configs";
import { NotifyUpcomingAppointmentsUseCase } from "../../usecase/notification/notify-upcoming-appointments.usecase";
import { ICompanyConfigRepository } from "../../usecase/repositories/icompany-config-repository";

export class NotifyWorker {
    private worker: Worker;

    constructor(
        private readonly notifyUseCase: NotifyUpcomingAppointmentsUseCase,
        private readonly companyConfigRepository: ICompanyConfigRepository
    ) {
        this.worker = new Worker(
            "notifications",
            async (job: Job) => {
                if (job.name === "check-upcoming-appointments") {
                    await this.handleGlobalCheck();
                    return;
                }

                const { companyId } = job.data;
                await this.notifyUseCase.execute(companyId);
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
            console.log(`[NotifyWorker] Job ${job.name} (${job.id}) completed`);
        });

        this.worker.on("failed", (job: Job | undefined, err: Error) => {
            console.error(`[NotifyWorker] FAILED job=${job?.name} id=${job?.id} attempt=${job?.attemptsMade} err=${err.message}`, {
                jobData: job?.data,
                stack: err.stack
            });
        });

        this.worker.on("stalled", (jobId: string) => {
            console.error(`[NotifyWorker] STALLED job id=${jobId} — worker may have crashed`);
        });
    }

    private async handleGlobalCheck() {
        const activeConfigs = await this.companyConfigRepository.findAllActive();
        for (const config of activeConfigs) {
            await this.notifyUseCase.execute(config.companyId);
        }
    }
}
