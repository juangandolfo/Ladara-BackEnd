import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1754854435570 implements MigrationInterface {
    name = 'Migrations1754854435570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`product\` ADD \`deletedAt\` datetime(6) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`deletedAt\``);
    }

}
