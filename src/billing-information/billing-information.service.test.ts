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

test("billing information creation and updates normalize optional fields", async () => {
    const user = {id: "user-1"} as any;
    const records = new Map<number, any>();
    let nextId = 1;
    const billingRepo: any = {
        find: async (options: any) => { assert.deepEqual(options.order, {createdAt: "DESC", id: "DESC"}); return [...records.values()]; },
        findOne: async ({where}: any) => records.get(where.id)?.user.id === where.user.id ? records.get(where.id) : null,
        create: (value: any) => ({...value}),
        save: async (value: any) => { value.id ??= nextId++; records.set(value.id, value); return value; },
        remove: async (value: any) => records.delete(value.id),
    };
    const service = new BillingInformationService(billingRepo, {findOneBy: async () => user} as any, {count: async () => 0} as any);
    const input: any = {
        fullName: " Jane Doe ", company: "  ", addressLine1: " 1 Main St ", addressLine2: " Apt 2 ",
        city: " City ", state: "  ", postalCode: " 12345 ", country: " Country ", phone: "  ",
    };

    const created = await service.createForUser(user.id, input);
    assert.deepEqual({fullName: created.fullName, company: created.company, addressLine1: created.addressLine1, addressLine2: created.addressLine2, state: created.state, phone: created.phone}, {
        fullName: "Jane Doe", company: null, addressLine1: "1 Main St", addressLine2: "Apt 2", state: null, phone: null,
    });
    assert.equal(created.user, user);
    assert.equal(await service.updateForUser(created.id, "another-user", input), null);
    const updated = await service.updateForUser(created.id, user.id, {...input, fullName: " New Name "});
    assert.equal(updated?.fullName, "New Name");
    assert.equal((await service.listForUser(user.id)).length, 1);
});

test("billing information rejects missing users and deletes unused owned records", async () => {
    const record = {id: 8, user: {id: "user-1"}};
    let removed = false;
    const service = new BillingInformationService(
        {findOne: async () => record, remove: async () => { removed = true; }} as any,
        {findOneBy: async () => null} as any,
        {count: async () => 0} as any,
    );
    await assert.rejects(service.createForUser("missing", {} as any), {message: "USER_NOT_FOUND"});
    assert.equal(await service.deleteForUser(8, "user-1"), true);
    assert.equal(removed, true);
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