import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class OrderFulfillmentStates1800000006000 implements MigrationInterface {
    name = "OrderFulfillmentStates1800000006000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const columns = [
            new TableColumn({
                name: "paymentStatus",
                type: "enum",
                enum: ["unpaid", "paid"],
                default: "'unpaid'",
                isNullable: false,
            }),
            new TableColumn({
                name: "paymentReference",
                type: "varchar",
                length: "255",
                isNullable: true,
            }),
            new TableColumn({
                name: "paidAt",
                type: "datetime",
                isNullable: true,
            }),
            new TableColumn({
                name: "invoiceIdentifier",
                type: "varchar",
                length: "100",
                isNullable: true,
            }),
            new TableColumn({
                name: "invoiceIssuedAt",
                type: "datetime",
                isNullable: true,
            }),
            new TableColumn({
                name: "isDelivered",
                type: "boolean",
                default: false,
                isNullable: false,
            }),
            new TableColumn({
                name: "deliveredAt",
                type: "datetime",
                isNullable: true,
            }),
            new TableColumn({
                name: "deliveryDocumentIdentifier",
                type: "varchar",
                length: "255",
                isNullable: true,
            }),
        ];

        for (const column of columns) {
            if (!(await queryRunner.hasColumn("order", column.name))) {
                await queryRunner.addColumn("order", column);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const columns = [
            "deliveryDocumentIdentifier",
            "deliveredAt",
            "isDelivered",
            "invoiceIssuedAt",
            "invoiceIdentifier",
            "paidAt",
            "paymentReference",
            "paymentStatus",
        ];

        for (const column of columns) {
            if (await queryRunner.hasColumn("order", column)) {
                await queryRunner.dropColumn("order", column);
            }
        }
    }
}
