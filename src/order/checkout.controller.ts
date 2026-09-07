import {Request, Response} from "express";

export class CheckoutController {
    async getCheckoutPage(req: Request, res: Response) {
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Checkout</title>
                <style>
                    body { font-family: sans-serif; }
                    .banner { display: flex; gap: 10px; padding: 10px; border-bottom: 1px solid #ccc; align-items: center; }
                    .logo { font-size: 1.5rem; font-weight: bold; cursor: pointer; }
                    .body { padding: 20px; }
                    #confirm-btn { padding: 10px 20px; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="banner">
                    <div class="logo" onclick="window.location.href='/'">MyStore</div>
                    <button onclick="window.location.href='/'">Home</button>
                    <button onclick="window.location.href='/cart'">Back to Cart</button>
                </div>
                <div class="body">
                    <button id="confirm-btn">Confirm Order</button>
                </div>

                <script>
                    document.getElementById('confirm-btn').addEventListener('click', () => {
                        alert('Order confirmed');
                    });
                </script>
            </body>
            </html>
        `);
    }
}
