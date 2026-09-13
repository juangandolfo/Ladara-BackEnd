import {MigrationInterface, QueryRunner} from "typeorm";

export class FixCartShippingTriggers1800000001000 implements MigrationInterface {
    name = "FixCartShippingTriggers1800000001000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS order_item_cart_shipping_after_insert;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS order_item_cart_shipping_after_update;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS order_item_cart_shipping_after_delete;`);
        await queryRunner.query(`DROP PROCEDURE IF EXISTS update_cart_order_shipping_cost;`);

        await queryRunner.query(`
            CREATE PROCEDURE update_cart_order_shipping_cost(IN p_shipping_cost DECIMAL(10,2), IN p_threshold DECIMAL(10,2), IN p_order_id INT)
            BEGIN
                UPDATE \`order\` o
                LEFT JOIN (
                    SELECT orderId, COALESCE(SUM(price * quantity), 0) AS subtotal
                    FROM order_item
                    GROUP BY orderId
                ) totals ON totals.orderId = o.id
                SET o.shippingCost = CASE
                    WHEN p_threshold > 0 AND COALESCE(totals.subtotal, 0) >= p_threshold THEN 0
                    ELSE p_shipping_cost
                END
                WHERE o.status = 'cart' AND (p_order_id IS NULL OR o.id = p_order_id);
            END;
        `);

        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_shipping_cost_after_insert;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_shipping_cost_after_update;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_free_shipping_threshold_after_insert;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_free_shipping_threshold_after_update;`);

        await queryRunner.query(`
            CREATE TRIGGER business_setting_shipping_cost_after_insert
            AFTER INSERT ON business_setting FOR EACH ROW
            BEGIN
                IF NEW.\`key\` = 'shippingCost' THEN
                    CALL update_cart_order_shipping_cost(NEW.value, (SELECT value FROM business_setting WHERE \`key\` = 'freeShippingThreshold'), NULL);
                END IF;
            END;
        `);
        await queryRunner.query(`
            CREATE TRIGGER business_setting_shipping_cost_after_update
            AFTER UPDATE ON business_setting FOR EACH ROW
            BEGIN
                IF NEW.\`key\` = 'shippingCost' AND OLD.value <> NEW.value THEN
                    CALL update_cart_order_shipping_cost(NEW.value, (SELECT value FROM business_setting WHERE \`key\` = 'freeShippingThreshold'), NULL);
                END IF;
            END;
        `);
        await queryRunner.query(`
            CREATE TRIGGER business_setting_free_shipping_threshold_after_insert
            AFTER INSERT ON business_setting FOR EACH ROW
            BEGIN
                IF NEW.\`key\` = 'freeShippingThreshold' THEN
                    CALL update_cart_order_shipping_cost((SELECT value FROM business_setting WHERE \`key\` = 'shippingCost'), NEW.value, NULL);
                END IF;
            END;
        `);
        await queryRunner.query(`
            CREATE TRIGGER business_setting_free_shipping_threshold_after_update
            AFTER UPDATE ON business_setting FOR EACH ROW
            BEGIN
                IF NEW.\`key\` = 'freeShippingThreshold' AND OLD.value <> NEW.value THEN
                    CALL update_cart_order_shipping_cost((SELECT value FROM business_setting WHERE \`key\` = 'shippingCost'), NEW.value, NULL);
                END IF;
            END;
        `);

        await queryRunner.query(`SET @shipping_cost = (SELECT value FROM business_setting WHERE \`key\` = 'shippingCost');`);
        await queryRunner.query(`SET @free_shipping_threshold = (SELECT value FROM business_setting WHERE \`key\` = 'freeShippingThreshold');`);
        await queryRunner.query(`CALL update_cart_order_shipping_cost(@shipping_cost, @free_shipping_threshold, NULL);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_shipping_cost_after_insert;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_shipping_cost_after_update;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_free_shipping_threshold_after_insert;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_free_shipping_threshold_after_update;`);
        await queryRunner.query(`DROP PROCEDURE IF EXISTS update_cart_order_shipping_cost;`);
    }
}