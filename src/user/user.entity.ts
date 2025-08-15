import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "users" })
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", nullable: false })
    name!: string;

    @Column({ type: "boolean", default: false })
    isAdmin!: boolean;
}