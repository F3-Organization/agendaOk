import { DataSource } from "typeorm";
import { performance } from "perf_hooks";
import { RedisService } from "../../infra/database/redis.service";
import { IEvolutionService } from "../ports/ievolution-service";


export interface HealthStatusResponse {
    status: "ok" | "degraded" | "error";
    timestamp: string;
    responseTime: string;
    services: {
        database: "connected" | "disconnected";
        redis: "connected" | "disconnected";
        evolutionApi: "connected" | "disconnected";
    };
    system: {
        uptime: number;
        memory: {
            heapUsed: string;
            heapTotal: string;
            rss: string;
        };
        nodeVersion: string;
        platform: string;
    };
}

export class GetHealthStatusUseCase {
    constructor(
        private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
        private readonly evolutionService: IEvolutionService
    ) {}

    async execute(): Promise<HealthStatusResponse> {
        const start = performance.now();

        const [dbOk, redisOk, evolutionOk] = await Promise.all([
            this.checkDatabase(),
            this.redisService.health(),
            this.evolutionService.health()
        ]);

        const end = performance.now();
        const responseTime = `${(end - start).toFixed(2)}ms`;

        const isEverythingOk = dbOk && redisOk && evolutionOk;
        const isSomethingOk = dbOk || redisOk || evolutionOk;

        let status: "ok" | "degraded" | "error" = "ok";
        if (!isEverythingOk) {
            status = isSomethingOk ? "degraded" : "error";
        }

        const memory = process.memoryUsage();

        return {
            status,
            timestamp: new Date().toISOString(),
            responseTime,
            services: {
                database: dbOk ? "connected" : "disconnected",
                redis: redisOk ? "connected" : "disconnected",
                evolutionApi: evolutionOk ? "connected" : "disconnected"
            },
            system: {
                uptime: process.uptime(),
                memory: {
                    heapUsed: this.formatBytes(memory.heapUsed),
                    heapTotal: this.formatBytes(memory.heapTotal),
                    rss: this.formatBytes(memory.rss)
                },
                nodeVersion: process.version,
                platform: process.platform
            }
        };
    }

    private async checkDatabase(): Promise<boolean> {
        try {
            if (!this.dataSource.isInitialized) return false;
            await this.dataSource.query("SELECT 1");
            return true;
        } catch {
            return false;
        }
    }

    private formatBytes(bytes: number): string {
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    }
}
