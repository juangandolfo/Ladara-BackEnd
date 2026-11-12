import {Repository} from "typeorm";
import {AnalyticsEvent} from "./analytics-event.entity";

export class AnalyticsEventService {
    constructor(private readonly repository: Repository<AnalyticsEvent>) {}

    async record(type: string, description: string, actorName: string | null = null): Promise<void> {
        await this.repository.save(this.repository.create({type, description: description.slice(0, 255), actorName}));
    }
}
