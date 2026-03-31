import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { GetDashboardStatsUseCase } from "../../usecase/dashboard/get-dashboard-stats.usecase";

export class DashboardController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly getStats: GetDashboardStatsUseCase
    ) {
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.addProtectedRoute("GET", "/dashboard/stats", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as { id: string };
            const userId = user.id;

            const stats = await this.getStats.execute(userId);

            return reply.send(stats);
        }, {
            tags: ["Dashboard"],
            summary: "Obtém estatísticas gerais para a dashboard",
            response: {
                200: {
                    type: "object",
                    required: ["totalConfirmations", "managedReplies", "conversionRate", "confirmationsChange", "repliesChange", "conversionRateChange", "calendarConnected"],
                    properties: {
                        totalConfirmations: { type: "number" },
                        managedReplies: { type: "number" },
                        conversionRate: { type: "string" },
                        confirmationsChange: { type: "string" },
                        repliesChange: { type: "string" },
                        conversionRateChange: { type: "string" },
                        calendarConnected: { type: "boolean" },
                        whatsappNumberMissing: { type: "boolean" },
                        appointmentStats: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    status: { type: "string" },
                                    count: { type: "number" }
                                }
                            }
                        }
                    }
                }

            }
        });
    }
}
