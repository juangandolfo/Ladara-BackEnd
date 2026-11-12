import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity({name: "analytics_event"})
export class AnalyticsEvent {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({type: "varchar", length: 64})
    type: string;

    @Column({type: "varchar", length: 255})
    description: string;

    @Column({type: "varchar", length: 255, nullable: true})
    actorName: string | null;

    @CreateDateColumn({type: "datetime", precision: 6})
    createdAt: Date;
}
