import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./configs";
import { User } from "../database/entities/user.entity";
import { Client } from "../database/entities/client.entity";
import { Schedule } from "../database/entities/schedule.entity";
import { UserConfig } from "../database/entities/user-config.entity";
import { Subscription } from "../database/entities/subscription.entity";
import { SubscriptionPayment } from "../database/entities/subscription-payment.entity";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: env.database.host,
    port: env.database.port,
    username: env.database.user,
    password: env.database.password,
    database: env.database.database,
    synchronize: false,
    logging: env.debug(),
    entities: [User, Client, Schedule, UserConfig, Subscription, SubscriptionPayment],
    subscribers: [],
    migrations: [env.isProduction() ? "dist/migrations/*.js" : "src/migrations/*.ts"],
})


