import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { GetHealthStatusUseCase } from "../../usecase/system/get-health-status.usecase";
import { healthCheckSchema } from "./schemas/app.swagger";

export class AppController {
    public constructor(
        private readonly fastify: FastifyAdapter,
        private readonly getHealthStatus: GetHealthStatusUseCase
    ) {
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.addRoute("GET", "/health", async (request: FastifyRequest, reply: FastifyReply) => {
            const health = await this.getHealthStatus.execute();
            
            if (health.status === "error") {
                return reply.code(503).send(health);
            }
            
            return reply.send(health);
        }, healthCheckSchema);
    }
}