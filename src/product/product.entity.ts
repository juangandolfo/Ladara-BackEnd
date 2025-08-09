import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

    @Entity()
    export class Product {
        @PrimaryGeneratedColumn()
        id: number;

        @Column({ length: 100 })
        name: string;

        @Column("decimal", { precision: 10, scale: 2 })
        price: number;

        @Column("text", { nullable: true })
        description?: string;

        @Column({ length: 50, nullable: true })
        code?: string;

        @Column("int", { default: 0 })
        stock: number;
    }