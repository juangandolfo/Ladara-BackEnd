"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./product/product.entity");
const user_entity_1 = require("./user/user.entity");
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "ladara",
    synchronize: true,
    logging: true,
    entities: [product_entity_1.Product, user_entity_1.User],
    migrations: [`${__dirname}/../db/migrations/*.ts`],
    subscribers: [],
});
//# sourceMappingURL=data-source.js.map