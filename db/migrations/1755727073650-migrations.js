"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migrations1755727073650 = void 0;
class Migrations1755727073650 {
    name = 'Migrations1755727073650';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`product\` ADD \`category\` varchar(50) NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`category\``);
    }
}
exports.Migrations1755727073650 = Migrations1755727073650;
//# sourceMappingURL=1755727073650-migrations.js.map