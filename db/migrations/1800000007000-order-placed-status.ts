import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class OrderPlacedStatus1800000007000 implements MigrationInterface {
    name = "OrderPlacedStatus1800000007000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn("order", "legacyWorkflowStatus"))) {
            await queryRunner.addColumn("order", new TableColumn({
                name: "legacyWorkflowStatus",
                type: "enum",
                enum: ["pending_payment", "preparing"],
                isNullable: true,
            }));
        }

        await queryRunner.query("UPDATE `order` SET `legacyWorkflowStatus` = `status` WHERE `status` IN ('pending_payment', 'preparing') AND `legacyWorkflowStatus` IS NULL;");
        await queryRunner.query("ALTER TABLE `order` MODIFY COLUMN `status` ENUM('cart', 'pending_payment', 'preparing', 'order_placed', 'completed') NOT NULL DEFAULT 'cart';");
        await queryRunner.query("UPDATE `order` SET `status` = 'order_placed' WHERE `status` IN ('pending_payment', 'preparing');");
        await queryRunner.query("ALTER TABLE `order` MODIFY COLUMN `status` ENUM('cart', 'order_placed', 'completed') NOT NULL DEFAULT 'cart';");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `order` MODIFY COLUMN `status` ENUM('cart', 'pending_payment', 'preparing', 'order_placed', 'completed') NOT NULL DEFAULT 'cart';");
        await queryRunner.query("UPDATE `order` SET `status` = COALESCE(`legacyWorkflowStatus`, 'pending_payment') WHERE `status` = 'order_placed';");
        if (await queryRunner.hasColumn("order", "legacyWorkflowStatus")) {
            await queryRunner.dropColumn("order", "legacyWorkflowStatus");
        }
        await queryRunner.query("ALTER TABLE `order` MODIFY COLUMN `status` ENUM('cart', 'pending_payment', 'preparing', 'completed') NOT NULL DEFAULT 'cart';");
    }
}
