import dotenv from 'dotenv';
import { DataSource } from "typeorm";
import { Product } from "./product/product.entity";

    dotenv.config();

    export const AppDataSource = new DataSource({
        type: "mysql",
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT) || 3306,
        username: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "password",
        database: process.env.DB_NAME || "ladara",
        synchronize: true,
        logging: true,
        entities: [Product],
        migrations: [`${__dirname}/../db/migrations/*.ts`],
        subscribers: [],
    });