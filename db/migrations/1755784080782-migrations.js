"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migrations1755784080782 = void 0;
class Migrations1755784080782 {
    name = 'Migrations1755784080782';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`discountedPrice\``);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`product\` ADD \`discountedPrice\` decimal(5,2) NOT NULL`);
    }
}
exports.Migrations1755784080782 = Migrations1755784080782;
//# sourceMappingURL=1755784080782-migrations.js.map