import assert from "node:assert/strict";
import test from "node:test";
import {EmailService} from "./email.service";

test("sends the cart and safe billing details to the system admin", async () => {
    let message: any;
    const transporter = {
        sendMail: async (mail: any) => {
            message = mail;
        },
    } as any;

    const previousEnvironment = {
        smtpHost: process.env.SMTP_HOST,
        adminEmail: process.env.ADMIN_EMAIL,
        smtpFrom: process.env.SMTP_FROM,
    };
    process.env.SMTP_HOST = "smtp.test.local";
    process.env.ADMIN_EMAIL = "admin@test.local";
    process.env.SMTP_FROM = "store@test.local";

    try {
        await new EmailService(transporter).sendOrderConfirmation({
            id: 42,
            user: {id: "user-1", name: "Ada Lovelace"},
            items: [{
                quantity: 2,
                price: 12.5,
                product: {id: 7, name: "Notebook"},
            }],
            total: 35,
            shippingCost: 10,
        } as any, {
            firstName: "Ada",
            address: "1 Example Street",
            cardNumber: "4111111111111111",
            cvv: "123",
        });

        assert.equal(message.to, "admin@test.local");
        assert.equal(message.from, "store@test.local");
        assert.equal(message.subject, "Order #42 confirmed");
        assert.match(message.text, /Notebook x2 - \$25\.00/);
        assert.match(message.text, /firstName: Ada/);
        assert.match(message.text, /address: 1 Example Street/);
        assert.doesNotMatch(message.text, /4111111111111111/);
        assert.doesNotMatch(message.text, /cvv: 123/);
    } finally {
        process.env.SMTP_HOST = previousEnvironment.smtpHost;
        process.env.ADMIN_EMAIL = previousEnvironment.adminEmail;
        process.env.SMTP_FROM = previousEnvironment.smtpFrom;
    }
});