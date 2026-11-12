import dotenv from 'dotenv';
import {DataSource} from "typeorm";
import {Product} from "./product/product.entity";
import {User} from "./user/user.entity";
import {Order} from "./order/entities/order.entity";
import {OrderItem} from "./order/entities/order-item.entity";
import {Discount} from "./discount/discount.entity";
import {BusinessSetting} from "./business-settings/business-setting.entity";
import {BillingInformation} from "./billing-information/billing-information.entity";
import {Category} from "./product/category.entity";
import {AnalyticsEvent} from "./analytics/analytics-event.entity";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "ladara",
    // Schema changes must be applied through migrations. Automatic enum
    // synchronization can invalidate existing order statuses during deploys.
    synchronize: false,
    logging: true,
    entities: [Product, Category, User, Order, OrderItem, Discount, BusinessSetting, BillingInformation, AnalyticsEvent],
    migrations: [`${__dirname}/../db/migrations/*.ts`],
    subscribers: [],
});