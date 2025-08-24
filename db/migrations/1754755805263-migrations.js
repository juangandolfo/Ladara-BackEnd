"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migrations1754755805263 = void 0;
class Migrations1754755805263 {
    name = 'Migrations1754755805263';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE \`product\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`price\` decimal(10,2) NOT NULL, \`description\` text NULL, \`code\` varchar(50) NULL, \`stock\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE \`product\``);
    }
}
exports.Migrations1754755805263 = Migrations1754755805263;
//# sourceMappingURL=1754755805263-migrations.js.map