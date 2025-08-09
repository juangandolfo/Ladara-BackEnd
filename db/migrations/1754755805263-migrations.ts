import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1754755805263 implements MigrationInterface {
    name = 'Migrations1754755805263'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`product\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`price\` decimal(10,2) NOT NULL, \`description\` text NULL, \`code\` varchar(50) NULL, \`stock\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`product\``);
    }

}
