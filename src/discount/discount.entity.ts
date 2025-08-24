import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
    import { User } from "../user/user.entity";

    @Entity()
    export class Discount {
        @PrimaryGeneratedColumn()
        id: number;

        @ManyToOne(() => User, { nullable: false })
        user: User;

        @Column("decimal", { precision: 5, scale: 2 })
        value: number;

        @Column({ default: "fixed" })
        type: "fixed" | "percent";

        @Column({ nullable: true })
        description: string;

        @Column({ type: "int", nullable: true })
        usesLeft: number | null; // null = unlimited uses
    }