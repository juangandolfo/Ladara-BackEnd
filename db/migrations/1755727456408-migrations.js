"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migrations1755727456408 = void 0;
class Migrations1755727456408 {
    name = 'Migrations1755727456408';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`product\` ADD \`discountedPrice\` decimal(5,2) NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`discountedPrice\``);
    }
}
exports.Migrations1755727456408 = Migrations1755727456408;
//# sourceMappingURL=1755727456408-migrations.js.map