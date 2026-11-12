import test from "node:test";
import assert from "node:assert/strict";
import {AnalyticsEventService} from "./analytics-event.service";

test("AnalyticsEventService persists activity with a bounded description and nullable actor", async () => {
    let saved: any;
    const repository: any = {
        create: (event: any) => event,
        save: async (event: any) => { saved = event; return event; },
    };
    const service = new AnalyticsEventService(repository);
    await service.record("order.placed", "x".repeat(300));

    assert.equal(saved.type, "order.placed");
    assert.equal(saved.description.length, 255);
    assert.equal(saved.actorName, null);
});
