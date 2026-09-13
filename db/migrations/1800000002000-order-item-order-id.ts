import {MigrationInterface, QueryRunner} from "typeorm";

export class OrderItemOrderId1800000002000 implements MigrationInterface {
    name = "OrderItemOrderId1800000002000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE item FROM order_item item
            LEFT JOIN \`order\` order_record ON order_record.id = item.orderId
            WHERE item.orderId IS NULL OR order_record.id IS NULL;
        `);
        await queryRunner.query(`
            ALTER TABLE order_item
            MODIFY COLUMN orderId INT NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE order_item
            MODIFY COLUMN orderId INT NULL;
        `);
    }
}