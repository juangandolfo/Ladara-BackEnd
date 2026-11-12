import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from "typeorm";
import { Product} from "../../product/product.entity";
import { Order } from "./order.entity";

@Entity()
export class OrderItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    orderId: number;

    @ManyToOne(() => Order, order => order.items, { nullable: false })
    @JoinColumn({ name: "orderId" })
    order: Order;

    @ManyToOne(() => Product, { nullable: false })
    product: Product;

    @Column("int")
    quantity: number;

    @Column({type: "int", nullable: true})
    categoryIdSnapshot: number | null;

    @Column({type: "varchar", length: 50, nullable: true})
    categoryNameSnapshot: string | null;

    @Column("decimal", { precision: 10, scale: 2 })
    price: number;
}