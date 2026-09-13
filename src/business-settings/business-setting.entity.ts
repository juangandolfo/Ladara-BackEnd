import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

@Entity({ name: "business_setting" })
export class BusinessSetting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 128, unique: true })
    key: string;

    @Column("decimal", { precision: 10, scale: 2 })
    value: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
