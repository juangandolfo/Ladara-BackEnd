"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migrations1755290298000 = void 0;
class Migrations1755290298000 {
    name = 'Migrations1755290298000';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`isAdmin\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE \`users\``);
    }
}
exports.Migrations1755290298000 = Migrations1755290298000;
//# sourceMappingURL=1755290298000-migrations.js.map