import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class OrderCheckoutDetails1800000003000 implements MigrationInterface {
    name = "OrderCheckoutDetails1800000003000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn("order", "billingAddress"))) {
            await queryRunner.addColumn("order", new TableColumn({
                name: "billingAddress",
                type: "json",
                isNullable: true,
            }));
        }
        if (!(await queryRunner.hasColumn("order", "paymentMethod"))) {
            await queryRunner.addColumn("order", new TableColumn({
                name: "paymentMethod",
                type: "varchar",
                length: "50",
                isNullable: true,
            }));
        }
        if (!(await queryRunner.hasColumn("order", "checkoutAt"))) {
            await queryRunner.addColumn("order", new TableColumn({
                name: "checkoutAt",
                type: "datetime",
                isNullable: true,
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn("order", "checkoutAt")) {
            await queryRunner.dropColumn("order", "checkoutAt");
        }
        if (await queryRunner.hasColumn("order", "paymentMethod")) {
            await queryRunner.dropColumn("order", "paymentMethod");
        }
        if (await queryRunner.hasColumn("order", "billingAddress")) {
            await queryRunner.dropColumn("order", "billingAddress");
        }
    }
}
