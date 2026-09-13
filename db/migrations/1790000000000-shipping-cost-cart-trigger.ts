import {MigrationInterface, QueryRunner} from "typeorm";

export class ShippingCostCartTrigger1790000000000 implements MigrationInterface {
    name = "ShippingCostCartTrigger1790000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP PROCEDURE IF EXISTS update_cart_order_shipping_cost;`);
        await queryRunner.query(`
            CREATE PROCEDURE update_cart_order_shipping_cost(IN p_shipping_cost DECIMAL(10,2))
            BEGIN
                UPDATE \`order\`
                SET shippingCost = p_shipping_cost
                WHERE status = 'cart';
            END;
        `);

        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_shipping_cost_after_insert;`);
        await queryRunner.query(`
            CREATE TRIGGER business_setting_shipping_cost_after_insert
            AFTER INSERT ON business_setting
            FOR EACH ROW
            BEGIN
                IF NEW.\`key\` = 'shippingCost' THEN
                    UPDATE \`order\`
                    SET shippingCost = NEW.value
                    WHERE status = 'cart';
                END IF;
            END;
        `);

        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_shipping_cost_after_update;`);
        await queryRunner.query(`
            CREATE TRIGGER business_setting_shipping_cost_after_update
            AFTER UPDATE ON business_setting
            FOR EACH ROW
            BEGIN
                IF NEW.\`key\` = 'shippingCost' AND OLD.value <> NEW.value THEN
                    UPDATE \`order\`
                    SET shippingCost = NEW.value
                    WHERE status = 'cart';
                END IF;
            END;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_shipping_cost_after_insert;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_shipping_cost_after_update;`);
        await queryRunner.query(`DROP PROCEDURE IF EXISTS update_cart_order_shipping_cost;`);
    }
}
