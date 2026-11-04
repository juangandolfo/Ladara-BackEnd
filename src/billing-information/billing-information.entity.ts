import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {User} from "../user/user.entity";

@Entity({name: "billing_information"})
export class BillingInformation {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, {nullable: false, onDelete: "CASCADE"})
    user: User;

    @Column({type: "text"})
    fullName: string;

    @Column({type: "text", nullable: true})
    company: string | null;

    @Column({type: "text"})
    addressLine1: string;

    @Column({type: "text", nullable: true})
    addressLine2: string | null;

    @Column({type: "text"})
    city: string;

    @Column({type: "text", nullable: true})
    state: string | null;

    @Column({type: "text"})
    postalCode: string;

    @Column({type: "text"})
    country: string;

    @Column({type: "text", nullable: true})
    phone: string | null;

    @CreateDateColumn()
    createdAt: Date;
}