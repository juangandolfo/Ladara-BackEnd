import test from "node:test";
import assert from "node:assert/strict";
import {UserService} from "./user.service";

test("UserService returns the requested entity and reports a missing user", async () => {
    const user = {id: "user-1"} as any;
    const service = new UserService({findOne: async ({where}: any) => where.id === user.id ? user : null} as any);

    assert.equal(await service.getEntityById(user.id), user);
    await assert.rejects(service.getEntityById("missing"), {message: 'User with id "missing" not found'});
});