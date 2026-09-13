import {MigrationInterface, QueryRunner} from "typeorm";

export class BusinessSettings1757000000000 implements MigrationInterface {
    name = "BusinessSettings1757000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS business_setting (
                id INT NOT NULL AUTO_INCREMENT,
                \`key\` VARCHAR(128) NOT NULL UNIQUE,
                value DECIMAL(10,2) NOT NULL,
                description VARCHAR(255) NULL,
                createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (id)
            ) ENGINE=InnoDB;
        `);

        await queryRunner.query(`
            INSERT INTO business_setting (\`key\`, value, description)
            VALUES ('shippingCost', 8.00, 'Delivery cost charged for active carts.')
            ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description);
        `);

        const orderTableHasShippingCost = await queryRunner.hasColumn("order", "shippingCost");
        if (!orderTableHasShippingCost) {
            await queryRunner.query(`
                ALTER TABLE \`order\`
                ADD COLUMN shippingCost DECIMAL(10,2) NOT NULL DEFAULT 0;
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const orderTableHasShippingCost = await queryRunner.hasColumn("order", "shippingCost");
        if (orderTableHasShippingCost) {
            await queryRunner.query(`ALTER TABLE \`order\` DROP COLUMN shippingCost;`);
        }
        await queryRunner.query(`DROP TABLE IF EXISTS business_setting;`);
    }
}
