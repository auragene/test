import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const PLANS = [
  { code: '1_month', duration: '1 month', price: 2000, label: 'Monthly' },
  { code: '3_months', duration: '3 months', price: 5500, label: 'Quarterly', featured: true },
  { code: '6_months', duration: '6 months', price: 10000, label: 'Half-yearly' },
  { code: '12_months', duration: '12 months', price: 20000, label: 'Yearly' },
];

export default function PackagePlanPage() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paying, setPaying] = useState(false);

  const startCheckout = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setPaying(true);
    try {
      const orderResponse = await createPlanPaymentOrder(
        email,
        selectedPlan.code,
      );
      await loadRazorpayCheckout();
      const order = orderResponse.data;
      const checkout = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Aura Grand Hotel',
        description: `${selectedPlan.duration} subscription`,
        order_id: order.order_id,
        prefill: { name: order.name, email: order.email },
        theme: { color: '#e94560' },
        handler: async (payment) => {
          setPaying(true);
          try {
            const result = await verifyPlanPayment({
              email: order.email,
              plan: selectedPlan.code,
              razorpay_order_id: payment.razorpay_order_id,
              razorpay_payment_id: payment.razorpay_payment_id,
              razorpay_signature: payment.razorpay_signature,
            });
            const expires = result.data.plan_expires_at
              ? new Date(result.data.plan_expires_at).toLocaleString()
              : '';
            setSuccess(
              result.data.status === 'active'
                ? `Payment verified. Your ${selectedPlan.duration} plan is active${expires ? ` until ${expires}` : ''}.`
                : `Payment verified, but this plan has expired. Please purchase a current plan.`,
            );
          } catch (verificationError) {
            setError(
              verificationError?.response?.data?.error ||
                'Payment was received but could not be verified. Please contact support before paying again.',
            );
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });
      checkout.on('payment.failed', (failure) => {
        setError(
          failure?.error?.description ||
            'Payment was not completed. Please try again.',
        );
        setPaying(false);
      });
      checkout.open();
    } catch (checkoutError) {
      setError(
        checkoutError?.response?.data?.error ||
          checkoutError?.message ||
          'Unable to start payment. Please try again.',
      );
      setPaying(false);
    }
  };

  const selectPlan = (plan) => {
    setSelectedPlan(plan);
    setEmail('');
    setError('');
    setSuccess('');
  };

  return (
    <main className="plans-page">
      <header className="plans-header">
        <Link className="plans-back-link" to="/login">
          <ArrowLeft size={17} /> Back to login
        </Link>
        <span className="plans-brand"><Crown size={18} /> Aura Grand Hotel</span>
      </header>

      <section className="plans-content">
        <div className="plans-intro">
          <p className="plans-eyebrow">Subscription plans</p>
          <h1>Choose the plan that works for you</h1>
          <p>Keep your hotel dashboard and ordering tools available with an active plan.</p>
        </div>

        <div className="plans-grid">
          {PLANS.map((plan) => (
            <article
              className={`plan-card${plan.featured ? ' featured' : ''}`}
              key={plan.duration}
            >
              {plan.featured && <span className="plan-popular">Popular</span>}
              <p className="plan-label">{plan.label}</p>
              <h2>{plan.duration}</h2>
              <p className="plan-price">
                <span className="plan-currency">₹</span>
                {plan.price.toLocaleString('en-IN')}
              </p>
              <p className="plan-period">for {plan.duration}</p>
              <div className="plan-divider" />
              <p className="plan-includes">
                <Check size={17} /> Hotel dashboard access
              </p>
              <button
                type="button"
                className="btn btn-primary btn-block plan-select-button"
                onClick={() => selectPlan(plan)}
              >
                Choose plan
              </button>
            </article>
          ))}
        </div>

      </section>

      {selectedPlan && (
        <div className="plan-modal-backdrop" role="presentation">
          <section
            className="plan-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-modal-title"
          >
            <button
              className="plan-modal-close"
              type="button"
              onClick={() => setSelectedPlan(null)}
              aria-label="Close"
            >
              ×
            </button>
            <p className="plans-eyebrow">Selected plan</p>
            <h2 id="plan-modal-title">
              {selectedPlan.duration} · ₹{selectedPlan.price.toLocaleString('en-IN')}
            </h2>
            <p className="plan-modal-copy">
              Enter the registered email for your Aura Grand service account.
            </p>
            {success ? (
              <div className="plan-payment-success" role="status">
                <p>{success}</p>
                <Link className="btn btn-primary btn-block" to="/login">
                  Continue to login
                </Link>
              </div>
            ) : (
              <form onSubmit={startCheckout}>
                <label className="form-label" htmlFor="plan-email">
                  Registered email address
                </label>
                <input
                  id="plan-email"
                  className="form-control"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoFocus
                  disabled={paying}
                />
                {error && <p className="plan-payment-error" role="alert">{error}</p>}
                <button
                  type="submit"
                  className="btn btn-primary btn-block plan-pay-button"
                  disabled={paying}
                >
                  {paying ? (
                    <>
                      <LoadingSpinner size={18} color="#fff" />
                      Processing…
                    </>
                  ) : (
                    `Pay ₹${selectedPlan.price.toLocaleString('en-IN')}`
                  )}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Unable to load the payment checkout.')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      script.remove();
      reject(new Error('Unable to load the payment checkout.'));
    };
    document.body.appendChild(script);
  });
}
