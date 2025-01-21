require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const { getFirestore, collection, query, where, limit, getDocs, addDoc, Timestamp } = require('firebase/firestore');

const app = express();
const YOUR_DOMAIN = 'http://localhost:5500'; // Local development URL
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Middleware
app.use(express.json());
app.use(cors());

// Create product IDs for our packages (run this once)
async function createProducts() {
    try {
        // Create Group Sessions product
        const groupProduct = await stripe.products.create({
            name: 'Group Sessions',
            description: 'Weekly 2-Hour Group Sessions (max 6 students)',
        });

        const groupPrice = await stripe.prices.create({
            product: groupProduct.id,
            unit_amount: 4500, // £45.00
            currency: 'gbp',
            recurring: {
                interval: 'week',
            },
        });

        // Create 1-on-1 Sessions product
        const oneOnOneProduct = await stripe.products.create({
            name: '1-on-1 Sessions',
            description: 'Weekly 1-Hour Private Sessions',
        });

        const oneOnOnePrice = await stripe.prices.create({
            product: oneOnOneProduct.id,
            unit_amount: 5000, // £50.00
            currency: 'gbp',
            recurring: {
                interval: 'week',
            },
        });

        console.log('Products and prices created:', {
            group: { product: groupProduct.id, price: groupPrice.id },
            oneOnOne: { product: oneOnOneProduct.id, price: oneOnOnePrice.id },
        });
    } catch (error) {
        console.error('Error creating products:', error);
    }
}

// For development, we'll create products on server start
let PRICE_IDS = {
    group: 'price_1Qjl8PKYQc6tIRkjX1v0cgdx',
    'one-on-one': 'price_1Qjl8PKYQc6tIRkjoXs207o1'
};

// Initialize products on server start
async function initializeProducts() {
    try {
        // First, list existing products
        const products = await stripe.products.list();
        const prices = await stripe.prices.list();

        // Find existing products
        const groupProduct = products.data.find(p => p.name === 'Group Sessions');
        const oneOnOneProduct = products.data.find(p => p.name === '1-on-1 Sessions');

        // Find corresponding prices
        const groupPrice = prices.data.find(p => p.product === groupProduct?.id);
        const oneOnOnePrice = prices.data.find(p => p.product === oneOnOneProduct?.id);

        if (groupPrice && oneOnOnePrice) {
            PRICE_IDS = {
                group: groupPrice.id,
                'one-on-one': oneOnOnePrice.id
            };
            console.log('Using existing products:', PRICE_IDS);
        } else {
            // Create new products if they don't exist
            const result = await createProducts();
            console.log('Created new products');
        }
    } catch (error) {
        console.error('Error initializing products:', error);
    }
}

app.post('/create-checkout-session', async (req, res) => {
    const { package, userId, userEmail } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: PRICE_IDS[package],
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${YOUR_DOMAIN}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${YOUR_DOMAIN}/pricing.html`,
            customer_email: userEmail,
            metadata: {
                userId,
                package
            },
            subscription_data: {
                metadata: {
                    userId,
                    package
                }
            }
        });

        console.log('Created session:', session.id);
        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating session:', error);
        console.error('Full error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/check-subscription/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get user's subscription from Firestore
        const db = getFirestore();
        const subscriptionsRef = collection(db, 'subscriptions');
        const q = query(
            subscriptionsRef,
            where('userId', '==', userId),
            where('status', '==', 'active'),
            limit(1)
        );
        
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            const subscription = snapshot.docs[0].data();
            res.json({ subscription });
        } else {
            res.json({ subscription: null });
        }
    } catch (error) {
        console.error('Error checking subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook endpoint
app.post('/webhook', express.raw({type: 'application/json'}), async (request, response) => {
    const sig = request.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'customer.subscription.created':
            const subscription = event.data.object;
            const db = getFirestore();
            
            try {
                await addDoc(collection(db, 'subscriptions'), {
                    userId: subscription.metadata.userId,
                    type: subscription.metadata.package,
                    status: 'active',
                    currentPeriodEnd: Timestamp.fromMillis(subscription.current_period_end * 1000),
                    stripeSubscriptionId: subscription.id
                });
            } catch (error) {
                console.error('Error adding subscription to Firestore:', error);
            }
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    response.send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    await initializeProducts();
    console.log(`Server running on port ${PORT}`);
}); 