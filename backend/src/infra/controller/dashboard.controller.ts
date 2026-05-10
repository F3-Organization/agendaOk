import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { GetDashboardStatsUseCase } from "../../usecase/dashboard/get-dashboard-stats.usecase";
import { getDashboardStatsSchema } from "./schemas/dashboard.swagger";

export class DashboardController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly getStats: GetDashboardStatsUseCase
    ) {
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.addProtectedRoute("GET", "/dashboard/stats", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as { id: string; companyId?: string };
            const companyId = user.companyId!;

            const stats = await this.getStats.execute(companyId);

            return reply.send(stats);
        }, getDashboardStatsSchema);
    }
}
