import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import {Category} from "./category.entity";

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

        @Column({ length: 50, nullable: false })
        category: string;

        @Column({type: "int", nullable: true})
        categoryId: number | null;

        @ManyToOne(() => Category, category => category.products, {nullable: true, onDelete: "RESTRICT"})
        @JoinColumn({name: "categoryId"})
        categoryEntity: Category | null;

        @Column({ length: 255, nullable: false })
        image: string;

        @DeleteDateColumn()
        deletedAt?: Date;

    }