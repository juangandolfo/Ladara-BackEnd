import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from "typeorm";
import { User} from "../../user/user.entity";
import { OrderItem } from "./order-item.entity";
import {OrderStatus} from "../types/order-status.type";
import {BillingInformation} from "../../billing-information/billing-information.entity";

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { nullable: false })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @Column("decimal", { precision: 10, scale: 2, default: 0 })
    total: number;

    @Column("decimal", { precision: 10, scale: 2, default: 0 })
    shippingCost: number;

    @ManyToOne(() => BillingInformation, {nullable: true, onDelete: "RESTRICT"})
    @JoinColumn({name: "billingInformationId"})
    billingInformation: BillingInformation | null;

    @Column({ type: "varchar", length: 50, nullable: true })
    paymentMethod: string | null;

    @Column({ type: "enum", enum: ["pending_payment", "preparing"], nullable: true, select: false })
    legacyWorkflowStatus: "pending_payment" | "preparing" | null;

    @Column({ type: "enum", enum: ["unpaid", "paid"], default: "unpaid" })
    paymentStatus: "unpaid" | "paid";

    @Column({ type: "varchar", length: 255, nullable: true })
    paymentReference: string | null;

    @Column({ type: "datetime", nullable: true })
    paidAt: Date | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    invoiceIdentifier: string | null;

    @Column({ type: "datetime", nullable: true })
    invoiceIssuedAt: Date | null;

    @Column({ type: "boolean", default: false })
    isDelivered: boolean;

    @Column({ type: "datetime", nullable: true })
    deliveredAt: Date | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    deliveryDocumentIdentifier: string | null;

    @Column({ type: "datetime", nullable: true })
    checkoutAt: Date | null;

    @Column({ type: "datetime", nullable: true })
    completedAt: Date | null;

    @OneToMany(() => OrderItem, item => item.order, { cascade: true })
    items: OrderItem[];

    @Column({
      type: 'enum',
      enum: OrderStatus,
      default: OrderStatus.CART
    })
    status: OrderStatus;
}