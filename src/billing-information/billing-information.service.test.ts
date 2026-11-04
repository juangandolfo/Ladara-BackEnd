import test from "node:test";
import assert from "node:assert/strict";
import {BillingInformationService} from "./billing-information.service";

test("billing information is always queried by its authenticated owner", async () => {
    let findOptions: any;
    const repository: any = {
        find: async (options: any) => { findOptions = options; return []; },
        findOne: async (options: any) => { findOptions = options; return null; },
    };
    const service = new BillingInformationService(repository, {} as any, {} as any);

    await service.listForUser("user-1");
    assert.deepEqual(findOptions.where, {user: {id: "user-1"}});
    await service.getForUser(3, "user-1");
    assert.deepEqual(findOptions.where, {id: 3, user: {id: "user-1"}});
});

test("billing information referenced by an order cannot be deleted", async () => {
    let removed = false;
    const service = new BillingInformationService(
        {findOne: async () => ({id: 3}), remove: async () => { removed = true; }} as any,
        {} as any,
        {count: async () => 1} as any,
    );

    await assert.rejects(service.deleteForUser(3, "user-1"), {message: "BILLING_INFORMATION_IN_USE"});
    assert.equal(removed, false);
});