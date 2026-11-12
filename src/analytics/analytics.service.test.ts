import test from "node:test";
import assert from "node:assert/strict";
import {AnalyticsService} from "./analytics.service";

function createService() {
    const paidOrders = [
        {
            id: 1,
            user: {id: "customer-1"},
            paymentStatus: "paid",
            paidAt: new Date("2026-10-01T04:00:00.000Z"),
            checkoutAt: new Date("2026-10-01T03:00:00.000Z"),
            total: "116.00",
            items: [{quantity: 1, price: "100.00", categoryIdSnapshot: 1, categoryNameSnapshot: "Accesorios"}],
            billingCountrySnapshot: "UY",
        },
    ];
    const placedOrders = [
        {
            id: 1,
            user: {id: "customer-1"},
            checkoutAt: new Date("2026-10-01T03:00:00.000Z"),
            billingCountrySnapshot: "UY",
        },
        {
            id: 2,
            user: {id: "customer-2"},
            checkoutAt: new Date("2026-10-02T03:00:00.000Z"),
            billingCountrySnapshot: "UY",
        },
    ];
    const orderRepository: any = {
        find: async (options: any) => options.where.paymentStatus === "paid" ? paidOrders : placedOrders,
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
    return new AnalyticsService(orderRepository, eventRepository, settings as any);
}

test("AnalyticsService returns period aggregates and localized daily revenue", async () => {
    const service = createService();
    const result = await service.getDashboard("2026-10-01", "2026-10-02");

    assert.deepEqual(result.sales, {currency: "UYU", confirmedRevenue: 116, paidOrderCount: 1});
    assert.deepEqual(result.revenueByDay, [
        {date: "2026-10-01", revenue: 116, paidOrderCount: 1},
        {date: "2026-10-02", revenue: 0, paidOrderCount: 0},
    ]);
    assert.deepEqual(result.monthlyTarget, {amount: 200, achievedAmount: 116, completionPercent: 58});
    assert.deepEqual(result.categorySales, [{
        categoryId: 1,
        categoryName: "Accesorios",
        revenue: 116,
        unitsSold: 1,
        sharePercent: 100,
    }]);
    assert.deepEqual(result.activeUsersByCountry, [{country: "UY", userCount: 2, sharePercent: 100}]);
    assert.equal(result.recentActivity[0].actorName, "Admin");
    assert.equal(result.period.timezone, "America/Montevideo");
});

test("AnalyticsService rejects invalid and overlong date ranges", async () => {
    const service = createService();
    await assert.rejects(service.getDashboard("2026-10-02", "2026-10-01"), /Invalid date range/);
    await assert.rejects(service.getDashboard("2025-01-01", "2026-01-02"), /366 days/);
    await assert.rejects(service.getDashboard("2026-02-30", "2026-03-01"), /Invalid date/);
});

test("AnalyticsService treats a missing target and empty records as unavailable without fabricated activity", async () => {
    const service = new AnalyticsService(
        {find: async () => []} as any,
        {find: async () => []} as any,
        {getBusinessTimezone: async () => "America/Montevideo", getMonthlySalesTarget: async () => null} as any,
    );
    const result = await service.getDashboard("2026-10-01", "2026-10-01");

    assert.deepEqual(result.monthlyTarget, {amount: null, achievedAmount: 0, completionPercent: null});
    assert.deepEqual(result.categorySales, []);
    assert.deepEqual(result.activeUsersByCountry, []);
    assert.deepEqual(result.recentActivity, []);
});
