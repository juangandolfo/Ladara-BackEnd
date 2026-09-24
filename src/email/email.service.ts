import nodemailer, {Transporter} from "nodemailer";
import {Order} from "../order/entities/order.entity";

export type BillingDetails = Record<string, string | number | boolean | null>;

export class EmailService {
    private readonly transporter: Transporter;

    constructor(transporter?: Transporter) {
        this.transporter = transporter || nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === "true",
            auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD
                ? {user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD}
                : undefined,
        });
    }

    async sendOrderConfirmation(order: Order, billing: BillingDetails): Promise<void> {
        const adminEmail = process.env.ADMIN_EMAIL;
        const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
        if (!process.env.SMTP_HOST || !adminEmail || !fromEmail) {
            throw new Error("SMTP_HOST, ADMIN_EMAIL and SMTP_FROM or SMTP_USER must be configured");
        }

        const items = (order.items || []).map(item => {
            const productName = item.product?.name || `Product #${item.product?.id || "unknown"}`;
            return `${productName} x${item.quantity} - $${(Number(item.price) * item.quantity).toFixed(2)}`;
        }).join("\n");
        const billingDetails = Object.entries(billing)
            .filter(([field]) => !/(card|cvv|cvc|security|password|token|secret)/i.test(field))
            .map(([field, value]) => `${field}: ${value ?? ""}`)
            .join("\n");

        await this.transporter.sendMail({
            from: fromEmail,
            to: adminEmail,
            subject: `Order #${order.id} confirmed`,
            text: [
                `Order #${order.id} has been confirmed.`,
                `Customer: ${order.user.name} (${order.user.id})`,
                "",
                "Cart:",
                items || "No items",
                "",
                `Total: $${Number(order.total).toFixed(2)}`,
                `Shipping: $${Number(order.shippingCost).toFixed(2)}`,
                "",
                "Billing information:",
                billingDetails || "No billing information provided",
            ].join("\n"),
        });
    }
}