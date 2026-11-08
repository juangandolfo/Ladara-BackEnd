import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import {AuthService} from "./auth.service";

test("AuthService promotes the first Google user and verifies the issued token", async () => {
    let savedUser: any;
    const repository: any = {
        findOne: async ({where}: any) => savedUser?.id === where.id ? savedUser : null,
        count: async () => 0,
        create: (user: any) => user,
        save: async (user: any) => { savedUser = user; return user; },
    };
    const service = new AuthService(repository);
    const result = await service.handleGoogleUser({id: "google-1", displayName: "First User"});

    assert.equal(result.user.isAdmin, true);
    assert.equal((await service.verifyToken(result.token)).user, savedUser);
});

test("AuthService preserves existing roles and rejects invalid or orphaned tokens", async () => {
    const existing = {id: "google-2", name: "Existing", isAdmin: false} as any;
    const repository: any = {
        findOne: async ({where}: any) => where.id === existing.id ? existing : null,
        count: async () => 10,
        create: (user: any) => user,
        save: async (user: any) => user,
    };
    const service = new AuthService(repository);
    const result = await service.handleGoogleUser({id: existing.id, displayName: "Changed"});
    assert.equal(result.user.isAdmin, false);

    await assert.rejects(service.verifyToken("invalid"), {message: "Invalid token"});
    const orphanToken = jwt.sign({id: "deleted-user", name: "Deleted"}, process.env.SECRET_JWT_KEY || "your_default_secret");
    await assert.rejects(service.verifyToken(orphanToken), {message: "Invalid token"});
});