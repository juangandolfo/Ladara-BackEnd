import {Not, Raw, Repository} from "typeorm";
import {BusinessSettingService} from "../business-settings/business-setting.service";
import {Order} from "../order/entities/order.entity";
import {OrderStatus} from "../order/types/order-status.type";
import {AnalyticsEvent} from "./analytics-event.entity";

const MAX_PERIOD_DAYS = 366;
const MONEY_PRECISION = 100;

export interface DashboardPeriod {
    from: string;
    to: string;
    timezone: string;
}

export interface DashboardData {
    period: DashboardPeriod;
    sales: {currency: "UYU"; confirmedRevenue: number; paidOrderCount: number};
    revenueByDay: Array<{date: string; revenue: number; paidOrderCount: number}>;
    monthlyTarget: {amount: number | null; achievedAmount: number; completionPercent: number | null};
    categorySales: Array<{categoryId: number; categoryName: string; revenue: number; unitsSold: number; sharePercent: number}>;
    activeUsersByCountry: Array<{country: string | null; userCount: number; sharePercent: number}>;
    recentActivity: Array<{id: string; type: string; description: string; createdAt: string; actorName: string | null}>;
}

function parseCalendarDate(value: string): {year: number; month: number; day: number; epoch: number} {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid date; expected YYYY-MM-DD");
    const [year, month, day] = value.split("-").map(Number);
    const epoch = Date.UTC(year, month - 1, day);
    const date = new Date(epoch);
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        throw new Error("Invalid date; expected a valid calendar date");
    }
    return {year, month, day, epoch};
}

function localMidnightToUtc(date: {year: number; month: number; day: number}, timezone: string): Date {
    const target = Date.UTC(date.year, date.month - 1, date.day);
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    });
    let candidate = target;
    for (let attempt = 0; attempt < 4; attempt++) {
        const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map(part => [part.type, part.value]));
        const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
        const adjustment = target - represented;
        if (adjustment === 0) break;
        candidate += adjustment;
    }
    return new Date(candidate);
}

function dateInTimezone(value: Date, timezone: string): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(value);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * MONEY_PRECISION) / MONEY_PRECISION;
}

function roundPercent(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeCountry(value: unknown): string | null {
    if (typeof value !== "string" || !value.trim()) return null;
    const normalized = value.trim().toLocaleUpperCase("en-US");
    if (/^[A-Z]{2}$/.test(normalized)) return normalized;
    const aliases: Record<string, string> = {
        "URUGUAY": "UY", "REPUBLICA ORIENTAL DEL URUGUAY": "UY", "REPÚBLICA ORIENTAL DEL URUGUAY": "UY",
        "ARGENTINA": "AR", "BRASIL": "BR", "BRAZIL": "BR", "CHILE": "CL", "PARAGUAY": "PY",
        "ESTADOS UNIDOS": "US", "UNITED STATES": "US", "USA": "US", "MEXICO": "MX", "MÉXICO": "MX",
        "ESPAÑA": "ES", "SPAIN": "ES", "COLOMBIA": "CO", "PERU": "PE", "PERÚ": "PE",
    };
    return aliases[normalized] ?? null;
}

export class AnalyticsService {
    constructor(
        private readonly orderRepository: Repository<Order>,
        private readonly eventRepository: Repository<AnalyticsEvent>,
        private readonly settingsService: Pick<BusinessSettingService, "getBusinessTimezone" | "getMonthlySalesTarget">,
    ) {}

    async getDashboard(from: string, to: string): Promise<DashboardData> {
        const fromDate = parseCalendarDate(from);
        const toDate = parseCalendarDate(to);
        if (fromDate.epoch > toDate.epoch) throw new Error("Invalid date range: from must be on or before to");
        const dayCount = Math.floor((toDate.epoch - fromDate.epoch) / 86_400_000) + 1;
        if (dayCount > MAX_PERIOD_DAYS) throw new Error("Date range cannot exceed 366 days");

        const timezone = await this.settingsService.getBusinessTimezone();
        // Validate the configured IANA zone before building a query.
        new Intl.DateTimeFormat("en-US", {timeZone: timezone});
        const start = localMidnightToUtc(fromDate, timezone);
        const afterEndDate = new Date(toDate.epoch + 86_400_000);
        const endExclusive = localMidnightToUtc({
            year: afterEndDate.getUTCFullYear(),
            month: afterEndDate.getUTCMonth() + 1,
            day: afterEndDate.getUTCDate(),
        }, timezone);
        const periodWhere = () => Raw(alias => `${alias} >= :periodStart AND ${alias} < :periodEnd`, {
            periodStart: start,
            periodEnd: endExclusive,
        });

        const [paidOrders, placedOrders, events, target] = await Promise.all([
            this.orderRepository.find({
                where: {paymentStatus: "paid", paidAt: periodWhere()},
                relations: ["items"],
            }),
            this.orderRepository.find({
                where: {status: Not(OrderStatus.CART), checkoutAt: periodWhere()},
                relations: ["user", "billingInformation"],
            }),
            this.eventRepository.find({
                where: {createdAt: periodWhere()},
                order: {createdAt: "DESC"},
                take: 20,
            }),
            this.settingsService.getMonthlySalesTarget(),
        ]);

        const revenueByDate = new Map<string, {revenue: number; paidOrderCount: number}>();
        for (let day = fromDate.epoch; day <= toDate.epoch; day += 86_400_000) {
            revenueByDate.set(new Date(day).toISOString().slice(0, 10), {revenue: 0, paidOrderCount: 0});
        }

        let confirmedRevenue = 0;
        const categoryTotals = new Map<number, {categoryName: string; revenue: number; unitsSold: number}>();
        for (const order of paidOrders) {
            const orderTotal = Number(order.total);
            if (!Number.isFinite(orderTotal)) continue;
            const date = dateInTimezone(order.paidAt as Date, timezone);
            const day = revenueByDate.get(date);
            if (day) {
                day.revenue = roundMoney(day.revenue + orderTotal);
                day.paidOrderCount += 1;
            }
            confirmedRevenue = roundMoney(confirmedRevenue + orderTotal);

            const itemAmounts = new Map<number, {categoryName: string; amount: number; unitsSold: number}>();
            let subtotal = 0;
            for (const item of order.items ?? []) {
                const categoryId = Number(item.categoryIdSnapshot);
                const categoryName = item.categoryNameSnapshot?.trim();
                if (!Number.isInteger(categoryId) || categoryId < 1 || !categoryName) continue;
                const quantity = Number(item.quantity);
                const lineAmount = Number(item.price) * quantity;
                if (!Number.isFinite(lineAmount) || lineAmount < 0 || !Number.isFinite(quantity)) continue;
                const existing = itemAmounts.get(categoryId) ?? {categoryName, amount: 0, unitsSold: 0};
                existing.amount += lineAmount;
                existing.unitsSold += quantity;
                itemAmounts.set(categoryId, existing);
                subtotal += lineAmount;
            }
            if (subtotal <= 0) continue;
            let allocated = 0;
            const entries = [...itemAmounts.entries()];
            entries.forEach(([categoryId, category], index) => {
                const allocation = index === entries.length - 1
                    ? roundMoney(orderTotal - allocated)
                    : roundMoney(orderTotal * category.amount / subtotal);
                allocated = roundMoney(allocated + allocation);
                const total = categoryTotals.get(categoryId) ?? {categoryName: category.categoryName, revenue: 0, unitsSold: 0};
                total.revenue = roundMoney(total.revenue + allocation);
                total.unitsSold += category.unitsSold;
                categoryTotals.set(categoryId, total);
            });
        }

        const uniqueUsers = new Map<string, {country: string | null; checkoutAt: Date}>();
        for (const order of placedOrders) {
            const userId = order.user?.id;
            if (!userId || !order.checkoutAt) continue;
            const existing = uniqueUsers.get(userId);
            if (!existing || order.checkoutAt > existing.checkoutAt) {
                uniqueUsers.set(userId, {
                    country: normalizeCountry(order.billingCountrySnapshot ?? order.billingInformation?.country),
                    checkoutAt: order.checkoutAt,
                });
            }
        }

        const countryCounts = new Map<string | null, number>();
        for (const user of uniqueUsers.values()) countryCounts.set(user.country, (countryCounts.get(user.country) ?? 0) + 1);
        const totalUsers = uniqueUsers.size;
        const activeUsersByCountry = [...countryCounts.entries()]
            .sort(([countryA, countA], [countryB, countB]) => countB - countA || String(countryA).localeCompare(String(countryB)))
            .map(([country, userCount]) => ({country, userCount, sharePercent: totalUsers ? roundPercent(userCount / totalUsers * 100) : 0}));

        const categorySales = [...categoryTotals.entries()]
            .sort(([idA], [idB]) => idA - idB)
            .map(([categoryId, category]) => ({
                categoryId,
                categoryName: category.categoryName,
                revenue: roundMoney(category.revenue),
                unitsSold: category.unitsSold,
                sharePercent: confirmedRevenue ? roundPercent(category.revenue / confirmedRevenue * 100) : 0,
            }));
        const amount = target === null ? null : Number(target);

        return {
            period: {from, to, timezone},
            sales: {currency: "UYU", confirmedRevenue, paidOrderCount: paidOrders.length},
            revenueByDay: [...revenueByDate.entries()].map(([date, value]) => ({date, ...value})),
            monthlyTarget: {
                amount,
                achievedAmount: confirmedRevenue,
                completionPercent: amount !== null && amount > 0 ? roundPercent(confirmedRevenue / amount * 100) : null,
            },
            categorySales,
            activeUsersByCountry,
            recentActivity: events.map(event => ({
                id: String(event.id),
                type: event.type,
                description: event.description,
                createdAt: event.createdAt.toISOString(),
                actorName: event.actorName ?? null,
            })),
        };
    }
}
