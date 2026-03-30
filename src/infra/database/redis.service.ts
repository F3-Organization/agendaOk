import Redis from "ioredis";
import { env } from "../config/configs";

export class RedisService {
    private client: Redis;

    constructor() {
        this.client = new Redis({
            host: env.redis.host,
            port: env.redis.port,
            password: env.redis.password,
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
}
