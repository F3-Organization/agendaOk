import { Worker, Job } from "bullmq";
import { env } from "../config/configs";
import { NotifyUpcomingAppointmentsUseCase } from "../../usecase/appointment/notify-upcoming-appointments.usecase";

export class NotifyWorker {
    private worker: Worker;

    constructor(
        private readonly notifyUpcoming: NotifyUpcomingAppointmentsUseCase
    ) {
        this.worker = new Worker(
            "appointment-notifications",
            async (job: Job) => {
                await this.notifyUpcoming.execute();
            },
            {
                connection: {
                    host: env.redis.host,
                    port: env.redis.port,
                    password: env.redis.password,
                },
            }
        );

        this.worker.on("failed", (job, err) => {
            console.error(`[NotifyWorker] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, {
                jobData: job?.data,
                stack: err?.stack,
            });
        });

        this.worker.on("stalled", (jobId) => {
            console.warn(`[NotifyWorker] Job ${jobId} stalled`);
        });
    }
}
