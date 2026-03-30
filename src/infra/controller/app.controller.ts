import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { GetHealthStatusUseCase } from "../../usecase/system/get-health-status.usecase";

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
        }, {
            tags: ["System"],
            summary: "Comprehensive health check of the API and its dependencies.",
            description: "Check the status of the Database, Redis, Evolution API, and system metrics.",
            response: {
                200: {
                    type: "object",
                    properties: {
                        status: { type: "string", example: "ok" },
                        timestamp: { type: "string", format: "date-time" },
                        responseTime: { type: "string", example: "45.20ms" },
                        services: {
                            type: "object",
                            properties: {
                                database: { type: "string" },
                                redis: { type: "string" },
                                evolutionApi: { type: "string" }
                            }
                        },
                        system: {
                            type: "object",
                            properties: {
                                uptime: { type: "number" },
                                memory: {
                                    type: "object",
                                    properties: {
                                        heapUsed: { type: "string" },
                                        heapTotal: { type: "string" },
                                        rss: { type: "string" }
                                    }
                                },
                                nodeVersion: { type: "string" },
                                platform: { type: "string" }
                            }
                        }
                    }
                },
                503: {
                    description: "Service Unavailable",
                    type: "object",
                    properties: {
                        status: { type: "string", example: "error" }
                    }
                }
            }
        });
    }
}