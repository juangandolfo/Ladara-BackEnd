import {And, LessThan, MoreThanOrEqual, Repository} from "typeorm";
import {BusinessSettingService} from "../business-settings/business-setting.service";
import {Order} from "../order/entities/order.entity";
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

function localMidnightToUtc(date: {year: number; month: number; day: number}, formatter: Intl.DateTimeFormat): Date {
    const target = Date.UTC(date.year, date.month - 1, date.day);
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

function reportDate(value: unknown): string {
    return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function toNumber(value: unknown): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
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
        const businessDateFormatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
        });
        const start = localMidnightToUtc(fromDate, businessDateFormatter);
        const afterEndDate = new Date(toDate.epoch + 86_400_000);
        const endExclusive = localMidnightToUtc({
            year: afterEndDate.getUTCFullYear(),
            month: afterEndDate.getUTCMonth() + 1,
            day: afterEndDate.getUTCDate(),
        }, businessDateFormatter);

        const dayBuckets: Array<{date: string; start: Date; end: Date}> = [];
        for (let day = fromDate.epoch; day <= toDate.epoch; day += 86_400_000) {
            const date = new Date(day);
            const nextDate = new Date(day + 86_400_000);
            dayBuckets.push({
                date: date.toISOString().slice(0, 10),
                start: localMidnightToUtc({year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate()}, businessDateFormatter),
                end: localMidnightToUtc({year: nextDate.getUTCFullYear(), month: nextDate.getUTCMonth() + 1, day: nextDate.getUTCDate()}, businessDateFormatter),
            });
        }
        const dayBucketSql = dayBuckets.map(() => "SELECT CAST(? AS DATE) AS reportDate, CAST(? AS DATETIME) AS startsAt, CAST(? AS DATETIME) AS endsAt").join(" UNION ALL ");
        const dailyRevenueSql = `
            SELECT dayBuckets.reportDate AS date,
                   COALESCE(SUM(o.total), 0) AS revenue,
                   COUNT(o.id) AS paidOrderCount
            FROM (${dayBucketSql}) dayBuckets
            LEFT JOIN \`order\` o
              ON o.paymentStatus = 'paid'
             AND o.paidAt >= dayBuckets.startsAt
             AND o.paidAt < dayBuckets.endsAt
            GROUP BY dayBuckets.reportDate
            ORDER BY dayBuckets.reportDate ASC`;
        const dayBucketParams = dayBuckets.flatMap(bucket => [bucket.date, bucket.start, bucket.end]);
        const paidOrdersParams = ["paid", start, endExclusive];
        const [dailyRows, categoryRows, countryRows, events, target] = await Promise.all([
            this.orderRepository.query(dailyRevenueSql, dayBucketParams),
            this.orderRepository.query(`
                WITH paid_orders AS (
                    SELECT id, total
                    FROM \`order\`
                    WHERE paymentStatus = ? AND paidAt >= ? AND paidAt < ?
                ), line_groups AS (
                    SELECT item.orderId,
                           item.categoryIdSnapshot AS categoryId,
                           item.categoryNameSnapshot AS categoryName,
                           SUM(item.price * item.quantity) AS categorySubtotal,
                           SUM(item.quantity) AS unitsSold
                    FROM order_item item
                    INNER JOIN paid_orders paid ON paid.id = item.orderId
                    WHERE item.categoryIdSnapshot IS NOT NULL
                      AND item.categoryNameSnapshot IS NOT NULL
                    GROUP BY item.orderId, item.categoryIdSnapshot, item.categoryNameSnapshot
                ), order_subtotals AS (
                    SELECT item.orderId, SUM(item.price * item.quantity) AS orderSubtotal
                    FROM order_item item
                    INNER JOIN paid_orders paid ON paid.id = item.orderId
                    GROUP BY item.orderId
                )
                SELECT paid.id AS orderId,
                       paid.total AS orderTotal,
                       subtotal.orderSubtotal AS orderSubtotal,
                       category_lines.categoryId,
                       category_lines.categoryName,
                       category_lines.categorySubtotal,
                       category_lines.unitsSold
                FROM paid_orders paid
                INNER JOIN line_groups category_lines ON category_lines.orderId = paid.id
                INNER JOIN order_subtotals subtotal ON subtotal.orderId = paid.id
                ORDER BY paid.id ASC, category_lines.categoryId ASC`, paidOrdersParams),
            this.orderRepository.query(`
                SELECT latest.country, COUNT(*) AS userCount
                FROM (
                    SELECT customerOrders.userId,
                           customerOrders.billingCountrySnapshot AS country,
                           ROW_NUMBER() OVER (PARTITION BY customerOrders.userId ORDER BY customerOrders.checkoutAt DESC, customerOrders.id DESC) AS rowNumber
                    FROM \`order\` customerOrders
                    WHERE customerOrders.status <> ?
                      AND customerOrders.checkoutAt >= ?
                      AND customerOrders.checkoutAt < ?
                ) latest
                WHERE latest.rowNumber = 1
                GROUP BY latest.country`, ["cart", start, endExclusive]),
            this.eventRepository.find({
                where: {createdAt: And(MoreThanOrEqual(start), LessThan(endExclusive))},
                order: {createdAt: "DESC"},
                take: 20,
            }),
            this.settingsService.getMonthlySalesTarget(),
        ]);

        const revenueByDate = new Map<string, {revenue: number; paidOrderCount: number}>();
        for (const row of dailyRows) {
            revenueByDate.set(reportDate(row.date), {revenue: roundMoney(toNumber(row.revenue)), paidOrderCount: toNumber(row.paidOrderCount)});
        }
        const confirmedRevenue = roundMoney([...revenueByDate.values()].reduce((sum, day) => sum + day.revenue, 0));
        const paidOrderCount = [...revenueByDate.values()].reduce((sum, day) => sum + day.paidOrderCount, 0);
        const categoryTotals = new Map<number, {categoryName: string; revenue: number; unitsSold: number}>();
        const orderCategories = new Map<number, Array<{categoryId: number; categoryName: string; categorySubtotal: number; orderTotal: number; orderSubtotal: number; unitsSold: number}>>();
        for (const row of categoryRows) {
            const orderId = Number(row.orderId);
            const categoryId = Number(row.categoryId);
            if (!Number.isInteger(orderId) || !Number.isInteger(categoryId) || categoryId < 1) continue;
            const categories = orderCategories.get(orderId) ?? [];
            categories.push({
                categoryId,
                categoryName: String(row.categoryName).trim(),
                categorySubtotal: toNumber(row.categorySubtotal),
                orderTotal: toNumber(row.orderTotal),
                orderSubtotal: toNumber(row.orderSubtotal),
                unitsSold: toNumber(row.unitsSold),
            });
            orderCategories.set(orderId, categories);
        }
        for (const categories of orderCategories.values()) {
            const first = categories[0];
            if (first.orderSubtotal <= 0) continue;
            let allocated = 0;
            categories.forEach((category, index) => {
                const allocation = index === categories.length - 1
                    ? roundMoney(first.orderTotal - allocated)
                    : roundMoney(first.orderTotal * category.categorySubtotal / first.orderSubtotal);
                allocated = roundMoney(allocated + allocation);
                const total = categoryTotals.get(category.categoryId) ?? {categoryName: category.categoryName, revenue: 0, unitsSold: 0};
                total.revenue = roundMoney(total.revenue + allocation);
                total.unitsSold += category.unitsSold;
                categoryTotals.set(category.categoryId, total);
            });
        }

        const countryCounts = new Map<string | null, number>();
        for (const row of countryRows) {
            const country = normalizeCountry(row.country);
            countryCounts.set(country, (countryCounts.get(country) ?? 0) + toNumber(row.userCount));
        }
        const totalUsers = [...countryCounts.values()].reduce((sum, count) => sum + count, 0);
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
            sales: {currency: "UYU", confirmedRevenue, paidOrderCount},
            revenueByDay: dayBuckets.map(bucket => ({date: bucket.date, ...(revenueByDate.get(bucket.date) ?? {revenue: 0, paidOrderCount: 0})})),
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
