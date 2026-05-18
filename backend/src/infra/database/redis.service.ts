import Redis from "ioredis";
import { env } from "../config/configs";

export class RedisService {
    private client: Redis;

    constructor() {
        this.client = new Redis({
            host: env.redis.host,
            port: env.redis.port,
            password: env.redis.password || undefined,
            lazyConnect: true,
            retryStrategy(times) {
                const delay = Math.min(times * 500, 30_000);
                return delay;
            },
            maxRetriesPerRequest: null,
        });

        this.client.on("error", (err) => {
            console.warn(`[Redis] Connection error (will retry): ${err.message}`);
        });

        this.client.on("connect", () => {
            console.log("[Redis] Connected successfully");
        });
    }

    async set(key: string, value: string, ttlSeconds: number): Promise<void> {
        await this.client.set(key, value, "EX", ttlSeconds);
    }

    async get(key: string): Promise<string | null> {
        return await this.client.get(key);
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    async health(): Promise<boolean> {
        try {
            const res = await this.client.ping();
            return res === "PONG";
        } catch (error) {
            return false;
        }
    }
}
