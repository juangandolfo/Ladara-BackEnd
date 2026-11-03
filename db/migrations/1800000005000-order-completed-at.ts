import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class OrderCompletedAt1800000005000 implements MigrationInterface {
    name = "OrderCompletedAt1800000005000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn("order", "completedAt"))) {
            await queryRunner.addColumn("order", new TableColumn({
                name: "completedAt",
                type: "datetime",
                isNullable: true,
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn("order", "completedAt")) {
            await queryRunner.dropColumn("order", "completedAt");
        }
    }
}