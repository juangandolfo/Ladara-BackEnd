import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1755727456408 implements MigrationInterface {
    name = 'Migrations1755727456408'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`product\` ADD \`discountedPrice\` decimal(5,2) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`discountedPrice\``);
    }

}
