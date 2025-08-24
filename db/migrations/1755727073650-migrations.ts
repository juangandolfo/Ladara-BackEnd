import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1755727073650 implements MigrationInterface {
    name = 'Migrations1755727073650'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`product\` ADD \`category\` varchar(50) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`category\``);
    }

}
