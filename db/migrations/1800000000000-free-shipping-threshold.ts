import {MigrationInterface, QueryRunner} from "typeorm";

export class FreeShippingThreshold1800000000000 implements MigrationInterface {
    name = "FreeShippingThreshold1800000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO business_setting (\`key\`, value, description)
            VALUES ('freeShippingThreshold', 0.00, 'Subtotal at which delivery becomes free for active carts. Zero disables free shipping.')
            ON DUPLICATE KEY UPDATE description = VALUES(description);
        `);

        await queryRunner.query(`DROP PROCEDURE IF EXISTS update_cart_order_shipping_cost;`);
        await queryRunner.query(`
            CREATE PROCEDURE update_cart_order_shipping_cost(IN p_order_id INT)
            BEGIN
                UPDATE \`order\` o
                JOIN business_setting shipping ON shipping.\`key\` = 'shippingCost'
                JOIN business_setting threshold ON threshold.\`key\` = 'freeShippingThreshold'
                LEFT JOIN (
                    SELECT orderId, COALESCE(SUM(price * quantity), 0) AS subtotal
                    FROM order_item
                    GROUP BY orderId
                ) totals ON totals.orderId = o.id
                SET o.shippingCost = CASE
                    WHEN threshold.value > 0 AND COALESCE(totals.subtotal, 0) >= threshold.value THEN 0
                    ELSE shipping.value
                END
                WHERE o.status = 'cart' AND (p_order_id IS NULL OR o.id = p_order_id);
            END;
        `);

        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_shipping_cost_after_insert;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_shipping_cost_after_update;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_free_shipping_threshold_after_insert;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_free_shipping_threshold_after_update;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS order_item_cart_shipping_after_insert;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS order_item_cart_shipping_after_update;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS order_item_cart_shipping_after_delete;`);

        await queryRunner.query(`
            CREATE TRIGGER business_setting_shipping_cost_after_insert
            AFTER INSERT ON business_setting FOR EACH ROW
            BEGIN
                IF NEW.\`key\` = 'shippingCost' THEN CALL update_cart_order_shipping_cost(NULL); END IF;
            END;
        `);
        await queryRunner.query(`
            CREATE TRIGGER business_setting_shipping_cost_after_update
            AFTER UPDATE ON business_setting FOR EACH ROW
            BEGIN
                IF NEW.\`key\` = 'shippingCost' AND OLD.value <> NEW.value THEN CALL update_cart_order_shipping_cost(NULL); END IF;
            END;
        `);
        await queryRunner.query(`
            CREATE TRIGGER business_setting_free_shipping_threshold_after_insert
            AFTER INSERT ON business_setting FOR EACH ROW
            BEGIN
                IF NEW.\`key\` = 'freeShippingThreshold' THEN CALL update_cart_order_shipping_cost(NULL); END IF;
            END;
        `);
        await queryRunner.query(`
            CREATE TRIGGER business_setting_free_shipping_threshold_after_update
            AFTER UPDATE ON business_setting FOR EACH ROW
            BEGIN
                IF NEW.\`key\` = 'freeShippingThreshold' AND OLD.value <> NEW.value THEN CALL update_cart_order_shipping_cost(NULL); END IF;
            END;
        `);
        await queryRunner.query(`
            CREATE TRIGGER order_item_cart_shipping_after_insert
            AFTER INSERT ON order_item FOR EACH ROW
            BEGIN
                CALL update_cart_order_shipping_cost(NEW.orderId);
            END;
        `);
        await queryRunner.query(`
            CREATE TRIGGER order_item_cart_shipping_after_update
            AFTER UPDATE ON order_item FOR EACH ROW
            BEGIN
                CALL update_cart_order_shipping_cost(NEW.orderId);
                IF OLD.orderId <> NEW.orderId THEN CALL update_cart_order_shipping_cost(OLD.orderId); END IF;
            END;
        `);
        await queryRunner.query(`
            CREATE TRIGGER order_item_cart_shipping_after_delete
            AFTER DELETE ON order_item FOR EACH ROW
            BEGIN
                CALL update_cart_order_shipping_cost(OLD.orderId);
            END;
        `);

        await queryRunner.query(`CALL update_cart_order_shipping_cost(NULL);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_shipping_cost_after_insert;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_shipping_cost_after_update;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_free_shipping_threshold_after_insert;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS business_setting_free_shipping_threshold_after_update;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS order_item_cart_shipping_after_insert;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS order_item_cart_shipping_after_update;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS order_item_cart_shipping_after_delete;`);
        await queryRunner.query(`DROP PROCEDURE IF EXISTS update_cart_order_shipping_cost;`);
    }
}