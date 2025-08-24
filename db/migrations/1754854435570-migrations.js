"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migrations1754854435570 = void 0;
class Migrations1754854435570 {
    name = 'Migrations1754854435570';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`product\` ADD \`deletedAt\` datetime(6) NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`deletedAt\``);
    }
}
exports.Migrations1754854435570 = Migrations1754854435570;
//# sourceMappingURL=1754854435570-migrations.js.map