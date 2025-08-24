import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1755784080782 implements MigrationInterface {
    name = 'Migrations1755784080782'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`discountedPrice\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`product\` ADD \`discountedPrice\` decimal(5,2) NOT NULL`);
    }

}
