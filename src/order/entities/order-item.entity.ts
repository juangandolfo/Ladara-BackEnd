import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { Product} from "../../product/product.entity";
import { Order } from "./order.entity";

@Entity()
export class OrderItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, order => order.items)
    order: Order;

    @ManyToOne(() => Product, { nullable: false })
    product: Product;

    @Column("int")
    quantity: number;

    @Column("decimal", { precision: 10, scale: 2 })
    price: number;
}