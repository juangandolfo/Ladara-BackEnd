import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from "typeorm";
import { User} from "../../user/user.entity";
import { OrderItem } from "./order-item.entity";
import {OrderStatus} from "../types/order-status.type";

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { nullable: false })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @Column("decimal", { precision: 10, scale: 2 })
    total: number;

    @OneToMany(() => OrderItem, item => item.order, { cascade: true })
    items: OrderItem[];

    @Column({
      type: 'enum',
      enum: OrderStatus,
      default: OrderStatus.CART
    })
    status: OrderStatus;
}