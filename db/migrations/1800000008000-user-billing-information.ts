import {MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey} from "typeorm";

export class UserBillingInformation1800000008000 implements MigrationInterface {
    name = "UserBillingInformation1800000008000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasTable("billing_information"))) {
            await queryRunner.createTable(new Table({
                name: "billing_information",
                columns: [
                    {name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment"},
                    {name: "userId", type: "varchar", length: "36", isNullable: false},
                    {name: "fullName", type: "text", isNullable: false},
                    {name: "company", type: "text", isNullable: true},
                    {name: "addressLine1", type: "text", isNullable: false},
                    {name: "addressLine2", type: "text", isNullable: true},
                    {name: "city", type: "text", isNullable: false},
                    {name: "state", type: "text", isNullable: true},
                    {name: "postalCode", type: "text", isNullable: false},
                    {name: "country", type: "text", isNullable: false},
                    {name: "phone", type: "text", isNullable: true},
                    {name: "createdAt", type: "datetime", precision: 6, default: "CURRENT_TIMESTAMP(6)", isNullable: false},
                ],
                foreignKeys: [new TableForeignKey({
                    columnNames: ["userId"],
                    referencedTableName: "users",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE",
                })],
            }), true);
        }

        if (!(await queryRunner.hasColumn("order", "billingInformationId"))) {
            await queryRunner.addColumn("order", new TableColumn({name: "billingInformationId", type: "int", isNullable: true}));
        }

        if (await queryRunner.hasColumn("order", "billingAddress")) {
            const rows: Array<{id: number; userId: string; billingAddress: unknown}> = await queryRunner.query(
                "SELECT `id`, `userId`, `billingAddress` FROM `order` WHERE `billingAddress` IS NOT NULL AND `billingInformationId` IS NULL",
            );
            for (const row of rows) {
                let address: any = row.billingAddress;
                if (typeof address === "string") {
                    try {
                        address = JSON.parse(address);
                    } catch {
                        continue;
                    }
                }
                if (!address || typeof address !== "object" || !address.fullName || !address.addressLine1 || !address.city || !address.postalCode || !address.country) {
                    continue;
                }
                const result: any = await queryRunner.query(
                    "INSERT INTO `billing_information` (`userId`, `fullName`, `company`, `addressLine1`, `addressLine2`, `city`, `state`, `postalCode`, `country`, `phone`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [row.userId, address.fullName, address.company ?? null, address.addressLine1, address.addressLine2 ?? null, address.city, address.state ?? null, address.postalCode, address.country, address.phone ?? null],
                );
                const billingInformationId = Number(result.insertId);
                await queryRunner.query("UPDATE `order` SET `billingInformationId` = ? WHERE `id` = ?", [billingInformationId, row.id]);
            }
        }

        const orderTable = await queryRunner.getTable("order");
        if (orderTable && !orderTable.foreignKeys.some((key) => key.columnNames.includes("billingInformationId"))) {
            await queryRunner.createForeignKey("order", new TableForeignKey({
                columnNames: ["billingInformationId"],
                referencedTableName: "billing_information",
                referencedColumnNames: ["id"],
                onDelete: "RESTRICT",
            }));
        }

        if (await queryRunner.hasColumn("order", "billingAddress")) {
            await queryRunner.dropColumn("order", "billingAddress");
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn("order", "billingAddress"))) {
            await queryRunner.addColumn("order", new TableColumn({name: "billingAddress", type: "json", isNullable: true}));
        }
        await queryRunner.query(
            "UPDATE `order` o LEFT JOIN `billing_information` b ON b.`id` = o.`billingInformationId` SET o.`billingAddress` = CASE WHEN b.`id` IS NULL THEN NULL ELSE JSON_OBJECT('fullName', b.`fullName`, 'company', b.`company`, 'addressLine1', b.`addressLine1`, 'addressLine2', b.`addressLine2`, 'city', b.`city`, 'state', b.`state`, 'postalCode', b.`postalCode`, 'country', b.`country`, 'phone', b.`phone`) END",
        );
        const orderTable = await queryRunner.getTable("order");
        const billingForeignKey = orderTable?.foreignKeys.find((key) => key.columnNames.includes("billingInformationId"));
        if (billingForeignKey) await queryRunner.dropForeignKey("order", billingForeignKey);
        if (await queryRunner.hasColumn("order", "billingInformationId")) {
            await queryRunner.dropColumn("order", "billingInformationId");
        }
        if (await queryRunner.hasTable("billing_information")) {
            await queryRunner.dropTable("billing_information");
        }
    }
}