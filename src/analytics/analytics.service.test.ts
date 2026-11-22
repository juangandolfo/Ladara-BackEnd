import test from "node:test";
import assert from "node:assert/strict";
import {AnalyticsService} from "./analytics.service";

function createService() {
    const queries: string[] = [];
    const orderRepository: any = {
        query: async (sql: string) => {
            queries.push(sql);
            if (sql.includes("AS paidOrderCount")) return [{date: "2026-10-01", revenue: "116.00", paidOrderCount: "1"}];
            if (sql.includes("AS categorySubtotal")) return [
                {orderId: 1, orderTotal: "116.00", orderSubtotal: "100.00", categoryId: 1, categoryName: "Accesorios", categorySubtotal: "60.00", unitsSold: "1"},
                {orderId: 1, orderTotal: "116.00", orderSubtotal: "100.00", categoryId: 2, categoryName: "Cables", categorySubtotal: "40.00", unitsSold: "2"},
            ];
            if (sql.includes("AS userCount")) return [{country: "UY", userCount: "2"}];
            throw new Error("Unexpected dashboard aggregate query");
        },
    };
    const eventRepository: any = {
        find: async () => [{
            id: 9,
            type: "product.created",
            description: "Producto creado",
            createdAt: new Date("2026-10-02T12:00:00.000Z"),
            actorName: "Admin",
        }],
    };
    const settings = {
        getBusinessTimezone: async () => "America/Montevideo",
        getMonthlySalesTarget: async () => 200,
    };
    return {service: new AnalyticsService(orderRepository, eventRepository, settings as any), queries};
}

test("AnalyticsService returns period aggregates and localized daily revenue", async () => {
    const {service, queries} = createService();
    const result = await service.getDashboard("2026-10-01", "2026-10-02");

    assert.deepEqual(result.sales, {currency: "UYU", confirmedRevenue: 116, paidOrderCount: 1});
    assert.deepEqual(result.revenueByDay, [
        {date: "2026-10-01", revenue: 116, paidOrderCount: 1},
        {date: "2026-10-02", revenue: 0, paidOrderCount: 0},
    ]);
    assert.deepEqual(result.monthlyTarget, {amount: 200, achievedAmount: 116, completionPercent: 58});
    assert.deepEqual(result.categorySales, [
        {categoryId: 1, categoryName: "Accesorios", revenue: 69.6, unitsSold: 1, sharePercent: 60},
        {categoryId: 2, categoryName: "Cables", revenue: 46.4, unitsSold: 2, sharePercent: 40},
    ]);
    assert.deepEqual(result.activeUsersByCountry, [{country: "UY", userCount: 2, sharePercent: 100}]);
    assert.equal(result.recentActivity[0].actorName, "Admin");
    assert.equal(result.period.timezone, "America/Montevideo");
    assert.equal(queries.length, 3);
    assert.ok(queries.every(query => !query.includes("SELECT *")));
});

test("AnalyticsService rejects invalid and overlong date ranges", async () => {
    const {service} = createService();
    await assert.rejects(service.getDashboard("2026-10-02", "2026-10-01"), /Invalid date range/);
    await assert.rejects(service.getDashboard("2025-01-01", "2026-01-02"), /366 days/);
    await assert.rejects(service.getDashboard("2026-02-30", "2026-03-01"), /Invalid date/);
});

test("AnalyticsService treats a missing target and empty records as unavailable without fabricated activity", async () => {
    const service = new AnalyticsService(
        {query: async () => []} as any,
        {find: async () => []} as any,
        {getBusinessTimezone: async () => "America/Montevideo", getMonthlySalesTarget: async () => null} as any,
    );
    const result = await service.getDashboard("2026-10-01", "2026-10-01");

    assert.deepEqual(result.monthlyTarget, {amount: null, achievedAmount: 0, completionPercent: null});
    assert.deepEqual(result.categorySales, []);
    assert.deepEqual(result.activeUsersByCountry, []);
    assert.deepEqual(result.recentActivity, []);
});
