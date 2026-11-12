import {MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex} from "typeorm";

export class DashboardAnalytics1800000009000 implements MigrationInterface {
    name = "DashboardAnalytics1800000009000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const settingColumns = [
            new TableColumn({name: "textValue", type: "varchar", length: "128", isNullable: true}),
        ];
        for (const column of settingColumns) {
            if (!(await queryRunner.hasColumn("business_setting", column.name))) {
                await queryRunner.addColumn("business_setting", column);
            }
        }

        if (!(await queryRunner.hasTable("analytics_event"))) {
            await queryRunner.createTable(new Table({
                name: "analytics_event",
                columns: [
                    {name: "id", type: "varchar", length: "36", isPrimary: true},
                    {name: "type", type: "varchar", length: "64", isNullable: false},
                    {name: "description", type: "varchar", length: "255", isNullable: false},
                    {name: "actorName", type: "varchar", length: "255", isNullable: true},
                    {name: "createdAt", type: "datetime", precision: 6, default: "CURRENT_TIMESTAMP(6)", isNullable: false},
                ],
                indices: [new TableIndex({name: "IDX_analytics_event_createdAt", columnNames: ["createdAt"]})],
            }), true);
        }

        if (!(await queryRunner.hasTable("category"))) {
            await queryRunner.createTable(new Table({
                name: "category",
                columns: [
                    {name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment"},
                    {name: "name", type: "varchar", length: "50", isUnique: true, isNullable: false},
                ],
            }), true);
        }
        await queryRunner.query("INSERT IGNORE INTO `category` (`name`) SELECT DISTINCT `category` FROM `product` WHERE `category` IS NOT NULL AND `category` <> ''");

        if (!(await queryRunner.hasColumn("product", "categoryId"))) {
            await queryRunner.addColumn("product", new TableColumn({name: "categoryId", type: "int", isNullable: true}));
        }
        await queryRunner.query("UPDATE `product` p JOIN `category` c ON c.`name` = p.`category` SET p.`categoryId` = c.`id` WHERE p.`categoryId` IS NULL");
        const productTable = await queryRunner.getTable("product");
        if (productTable && !productTable.foreignKeys.some(key => key.columnNames.includes("categoryId"))) {
            await queryRunner.createForeignKey("product", new TableForeignKey({
                columnNames: ["categoryId"], referencedTableName: "category", referencedColumnNames: ["id"], onDelete: "RESTRICT",
            }));
        }

        for (const column of [
            new TableColumn({name: "categoryIdSnapshot", type: "int", isNullable: true}),
            new TableColumn({name: "categoryNameSnapshot", type: "varchar", length: "50", isNullable: true}),
        ]) {
            if (!(await queryRunner.hasColumn("order_item", column.name))) await queryRunner.addColumn("order_item", column);
        }
        await queryRunner.query("UPDATE `order_item` oi JOIN `product` p ON p.`id` = oi.`productId` SET oi.`categoryIdSnapshot` = p.`categoryId`, oi.`categoryNameSnapshot` = p.`category` WHERE oi.`categoryIdSnapshot` IS NULL");

        if (!(await queryRunner.hasColumn("order", "billingCountrySnapshot"))) {
            await queryRunner.addColumn("order", new TableColumn({name: "billingCountrySnapshot", type: "varchar", length: "100", isNullable: true}));
        }
        await queryRunner.query("UPDATE `order` o JOIN `billing_information` b ON b.`id` = o.`billingInformationId` SET o.`billingCountrySnapshot` = b.`country` WHERE o.`billingCountrySnapshot` IS NULL");

        const indexes = [
            ["order", "IDX_order_analytics_dates", ["paymentStatus", "paidAt", "checkoutAt"]],
            ["order_item", "IDX_order_item_analytics", ["orderId", "productId"]],
        ] as const;
        for (const [table, name, columns] of indexes) {
            const current = await queryRunner.getTable(table);
            if (current && !current.indices.some(index => index.name === name)) {
                await queryRunner.createIndex(table, new TableIndex({name, columnNames: [...columns]}));
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const table of ["order", "order_item"]) {
            const current = await queryRunner.getTable(table);
            const index = current?.indices.find(value => ["IDX_order_analytics_dates", "IDX_order_item_analytics"].includes(value.name ?? ""));
            if (current && index) await queryRunner.dropIndex(table, index);
        }
        const productTable = await queryRunner.getTable("product");
        const categoryForeignKey = productTable?.foreignKeys.find(key => key.columnNames.includes("categoryId"));
        if (categoryForeignKey) await queryRunner.dropForeignKey("product", categoryForeignKey);
        if (await queryRunner.hasColumn("order_item", "categoryNameSnapshot")) await queryRunner.dropColumn("order_item", "categoryNameSnapshot");
        if (await queryRunner.hasColumn("order_item", "categoryIdSnapshot")) await queryRunner.dropColumn("order_item", "categoryIdSnapshot");
        if (await queryRunner.hasColumn("product", "categoryId")) await queryRunner.dropColumn("product", "categoryId");
        if (await queryRunner.hasColumn("order", "billingCountrySnapshot")) await queryRunner.dropColumn("order", "billingCountrySnapshot");
        await queryRunner.query("DROP TABLE IF EXISTS `category`");
        await queryRunner.query("DROP TABLE IF EXISTS `analytics_event`");
        if (await queryRunner.hasColumn("business_setting", "textValue")) {
            await queryRunner.dropColumn("business_setting", "textValue");
        }
    }
}
