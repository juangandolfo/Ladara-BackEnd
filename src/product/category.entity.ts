import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Product} from "./product.entity";

@Entity({name: "category"})
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "varchar", length: 50, unique: true})
    name: string;

    @OneToMany(() => Product, product => product.categoryEntity)
    products: Product[];
}
