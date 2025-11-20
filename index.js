require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

// Middlewares
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
});

// Device config without location
const devices = {
    'device-123': {
        orgId: 'org-rahma',
        currency: 'cad',
        presets: [
            { id: 'small', amount: 500, label: '$5' },
            { id: 'medium', amount: 2000, label: '$20' },
            { id: 'large', amount: 5000, label: '$50' },
        ],
    },
};

app.get('/devices/:deviceId/config', (req, res) => {
    const device = devices[req.params.deviceId];
    if (!device) return res.status(404).json({ error: 'Unknown device' });
    res.json(device);
});

// Provide connection token
app.post('/connection_token', async (req, res) => {
    try {
        const token = await stripe.terminal.connectionTokens.create();
        res.json({ secret: token.secret });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create PaymentIntent
app.post('/payment_intents', async (req, res) => {
    try {
        const { amount, currency } = req.body;

        if (!amount || !currency) {
            return res.status(400).json({ error: 'Missing amount or currency' });
        }

        const pi = await stripe.paymentIntents.create({
            amount,
            currency,
            payment_method_types: ['card_present', 'interac_present'],
            capture_method: 'automatic',
        });

        res.json(pi);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
