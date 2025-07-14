const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // use test key for dev

exports.createCheckoutSession = async (req, res) => {
  try {
    console.log('[Stripe] Incoming body:', req.body); // ✅ Log input

    const { eventId, eventName, price, userEmail } = req.body;

    if (!eventId || !eventName || !price || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: eventName },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?eventId=${eventId}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancelled`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe Error]', error);
    res.status(500).json({ error: 'Payment session creation failed' });
  }
};

