import {MigrationInterface, QueryRunner} from "typeorm";

export class OrderPendingPaymentStatus1800000004000 implements MigrationInterface {
    name = "OrderPendingPaymentStatus1800000004000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `order` MODIFY COLUMN status ENUM('cart', 'pending_payment', 'preparing', 'completed') NOT NULL DEFAULT 'cart';");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("UPDATE `order` SET status = 'preparing' WHERE status = 'pending_payment';");
        await queryRunner.query("ALTER TABLE `order` MODIFY COLUMN status ENUM('cart', 'preparing', 'completed') NOT NULL DEFAULT 'cart';");
    }
}
