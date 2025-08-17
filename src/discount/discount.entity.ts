import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Discount {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    clientId: string;

    @Column("decimal", { precision: 5, scale: 2 })
    value: number;

    @Column({ default: "fixed" })
    type: "fixed" | "percent";

    @Column({ nullable: true })
    description: string;

    @Column({ type: "int", nullable: true })
    usesLeft: number | null; // null = unlimited uses
}