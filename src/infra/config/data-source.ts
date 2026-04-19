import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./configs";
import { User } from "../database/entities/user.entity";
import { Company } from "../database/entities/company.entity";
import { CompanyConfig } from "../database/entities/company-config.entity";
import { Client } from "../database/entities/client.entity";
import { Schedule } from "../database/entities/schedule.entity";
import { UserConfig } from "../database/entities/user-config.entity";
import { Subscription } from "../database/entities/subscription.entity";
import { SubscriptionPayment } from "../database/entities/subscription-payment.entity";
import { Integration } from "../database/entities/integration.entity";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: env.database.host,
    port: env.database.port,
    username: env.database.user,
    password: env.database.password,
    database: env.database.database,
    synchronize: false,
    logging: env.debug(),
    entities: [User, Company, CompanyConfig, Client, Schedule, UserConfig, Subscription, SubscriptionPayment, Integration],
    subscribers: [],
    migrations: [],
})


