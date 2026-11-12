import test from "node:test";
import assert from "node:assert/strict";
import {BusinessSettingService} from "./business-setting.service";

function createService() {
    const values = new Map<string, any>();
    const repository: any = {
        findOneBy: async ({key}: {key: string}) => values.get(key) ?? null,
        create: (setting: any) => ({...setting}),
        save: async (setting: any) => { values.set(setting.key, setting); return setting; },
    };
    return {service: new BusinessSettingService(repository), values};
}

test("dashboard settings default to Uruguay timezone and no configured target", async () => {
    const {service} = createService();
    assert.equal(await service.getBusinessTimezone(), "America/Montevideo");
    assert.equal(await service.getMonthlySalesTarget(), null);
});

test("dashboard settings persist a non-negative UYU target and a valid IANA timezone", async () => {
    const {service, values} = createService();
    await service.setMonthlySalesTarget("250000.50");
    await service.setBusinessTimezone("America/Santiago");

    assert.equal(await service.getMonthlySalesTarget(), 250000.5);
    assert.equal(await service.getBusinessTimezone(), "America/Santiago");
    assert.equal(values.get("monthlySalesTarget").value, 250000.5);
    assert.equal(values.get("timezone").textValue, "America/Santiago");
});

test("dashboard settings reject invalid target values and invalid timezone identifiers", async () => {
    const {service} = createService();
    assert.throws(() => BusinessSettingService.normalizeMonthlySalesTarget(-1));
    assert.throws(() => BusinessSettingService.normalizeMonthlySalesTarget("12.345"));
    assert.throws(() => BusinessSettingService.normalizeBusinessTimezone("Mars/Olympus"));
    await assert.rejects(service.setMonthlySalesTarget("not-a-number"));
    await assert.rejects(service.setBusinessTimezone(""));
});
