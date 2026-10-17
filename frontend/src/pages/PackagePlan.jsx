import { Link } from 'react-router-dom';
import './PackagePlan.css';

const PLANS = [
  { duration: '1 month', price: 2000, label: 'Monthly' },
  { duration: '3 months', price: 5500, label: 'Quarterly', featured: true },
  { duration: '6 months', price: 10000, label: 'Half-yearly' },
  { duration: '12 months', price: 20000, label: 'Yearly' },
];

export default function PackagePlanPage() {
  return (
    <main className="plans-page">
      <header className="plans-header">
        <Link className="plans-back-link" to="/login">
          <PlanIcon name="arrow-left" /> Back to login
        </Link>
        <span className="plans-brand">
          <PlanIcon name="crown" /> Aura Grand Smart Restaurant
        </span>
      </header>

      <section className="plans-content">
        <div className="plans-intro">
          <p className="plans-eyebrow">Subscription plans</p>
          <h1>Choose the plan that works for you</h1>
          <p>Compare plans for your hotel dashboard and ordering tools.</p>
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
                <PlanIcon name="check" /> Hotel dashboard access
              </p>
              <p className="plan-card-note">Plan overview</p>
            </article>
          ))}
        </div>

        <a className="plans-explore-link" href="#about-aura">
          Discover the Aura Grand workspace
          <PlanIcon name="arrow-down" />
        </a>
      </section>

      <section className="plans-about" id="about-aura" aria-labelledby="about-aura-title">
        <div className="plans-about-visual">
          <RestaurantWorkspaceIllustration />
          <span className="plans-visual-caption">
            <span className="plans-caption-dot" />
            One workspace. Smoother service.
          </span>
        </div>

        <div className="plans-about-copy">
          <p className="plans-eyebrow">A calmer way to run service</p>
          <h2 id="about-aura-title">Everything your restaurant needs, working together.</h2>
          <p className="plans-about-lead">
            Aura Grand Smart Restaurant brings the day-to-day essentials into one
            clear workspace, so your team can spend less time coordinating and
            more time looking after guests.
          </p>

          <div className="plans-benefits">
            <article className="plans-benefit">
              <span className="plans-benefit-icon"><PlanIcon name="orders" /></span>
              <div>
                <h3>Orders that stay in sync</h3>
                <p>Follow each order from placement through preparation and service.</p>
              </div>
            </article>
            <article className="plans-benefit">
              <span className="plans-benefit-icon"><PlanIcon name="menu" /></span>
              <div>
                <h3>Your menu, your way</h3>
                <p>Keep products, prices, availability, and restaurant details together.</p>
              </div>
            </article>
            <article className="plans-benefit">
              <span className="plans-benefit-icon"><PlanIcon name="tables" /></span>
              <div>
                <h3>Simple table-side ordering</h3>
                <p>Use table QR codes to help guests browse and place orders from their seats.</p>
              </div>
            </article>
            <article className="plans-benefit">
              <span className="plans-benefit-icon"><PlanIcon name="settings" /></span>
              <div>
                <h3>A workspace for your team</h3>
                <p>Manage tables, restaurant settings, and brand colors from one place.</p>
              </div>
            </article>
          </div>

          <Link className="plans-login-link" to="/login">
            Sign in to your workspace <PlanIcon name="arrow-right" />
          </Link>
        </div>
      </section>

      <footer className="plans-footer">
        <span>Aura Grand Smart Restaurant</span>
        <span>Thoughtfully designed for hospitality.</span>
      </footer>
    </main>
  );
}

function RestaurantWorkspaceIllustration() {
  return (
    <svg
      className="plans-workspace-art"
      viewBox="0 0 640 500"
      role="img"
      aria-labelledby="workspace-art-title workspace-art-description"
    >
      <title id="workspace-art-title">Restaurant service workspace illustration</title>
      <desc id="workspace-art-description">
        A restaurant table and meal beside a digital order dashboard with menu and table cards.
      </desc>
      <defs>
        <linearGradient id="art-background" x1="54" y1="32" x2="566" y2="466" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--brand-secondary, #d4fe70)" stopOpacity=".34" />
          <stop offset="1" stopColor="var(--brand-primary, #00b757)" stopOpacity=".12" />
        </linearGradient>
        <linearGradient id="art-screen" x1="280" y1="90" x2="541" y2="367" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#f5f8f4" />
        </linearGradient>
      </defs>
      <rect x="20" y="18" width="600" height="464" rx="36" fill="url(#art-background)" />
      <circle cx="93" cy="94" r="38" fill="var(--brand-secondary, #d4fe70)" fillOpacity=".34" />
      <circle cx="555" cy="402" r="52" fill="var(--brand-primary, #00b757)" fillOpacity=".1" />

      <g transform="rotate(-3 402 225)">
        <rect x="260" y="76" width="300" height="292" rx="23" fill="#24352e" fillOpacity=".12" />
        <rect x="250" y="66" width="300" height="292" rx="23" fill="url(#art-screen)" stroke="#fff" strokeWidth="8" />
        <path d="M274 66h252a24 24 0 0 1 24 24v39H250V90a24 24 0 0 1 24-24Z" fill="var(--brand-primary, #00b757)" />
        <circle cx="274" cy="100" r="4" fill="#fff" fillOpacity=".72" />
        <circle cx="289" cy="100" r="4" fill="#fff" fillOpacity=".48" />
        <circle cx="304" cy="100" r="4" fill="#fff" fillOpacity=".3" />
        <rect x="274" y="151" width="112" height="10" rx="5" fill="#24352e" />
        <rect x="274" y="169" width="166" height="6" rx="3" fill="#dce5df" />
        <rect x="274" y="193" width="244" height="45" rx="11" fill="#fff" stroke="#e7ece8" />
        <circle cx="296" cy="215" r="11" fill="var(--brand-secondary, #d4fe70)" fillOpacity=".55" />
        <path d="M291 215h10m-5-5v10" stroke="var(--brand-primary, #00b757)" strokeWidth="2" strokeLinecap="round" />
        <rect x="315" y="207" width="94" height="6" rx="3" fill="#6e7c74" />
        <rect x="315" y="219" width="61" height="5" rx="2.5" fill="#dce5df" />
        <rect x="461" y="207" width="42" height="20" rx="10" fill="var(--brand-secondary, #d4fe70)" fillOpacity=".45" />
        <rect x="274" y="248" width="244" height="45" rx="11" fill="#fff" stroke="#e7ece8" />
        <circle cx="296" cy="270" r="11" fill="var(--brand-primary, #00b757)" fillOpacity=".12" />
        <path d="M291 270h10m-5-5v10" stroke="var(--brand-primary, #00b757)" strokeWidth="2" strokeLinecap="round" />
        <rect x="315" y="262" width="88" height="6" rx="3" fill="#6e7c74" />
        <rect x="315" y="274" width="72" height="5" rx="2.5" fill="#dce5df" />
        <rect x="461" y="262" width="42" height="20" rx="10" fill="var(--brand-primary, #00b757)" fillOpacity=".12" />
        <rect x="274" y="308" width="104" height="25" rx="8" fill="var(--brand-primary, #00b757)" />
        <rect x="286" y="318" width="62" height="5" rx="2.5" fill="#fff" fillOpacity=".9" />
      </g>

      <g>
        <ellipse cx="182" cy="361" rx="119" ry="45" fill="#24352e" fillOpacity=".12" />
        <ellipse cx="182" cy="347" rx="119" ry="45" fill="#fff" />
        <ellipse cx="182" cy="347" rx="91" ry="32" fill="#f5f7f3" stroke="#e2e9e3" strokeWidth="2" />
        <ellipse cx="182" cy="347" rx="64" ry="22" fill="#fff" />
        <circle cx="160" cy="344" r="12" fill="var(--brand-primary, #00b757)" fillOpacity=".82" />
        <circle cx="181" cy="352" r="10" fill="var(--brand-secondary, #d4fe70)" />
        <circle cx="202" cy="341" r="13" fill="#8aa66d" />
        <path d="M147 352c11-9 24-12 39-9m-10 19c13-11 26-14 43-12" stroke="#527856" strokeWidth="3" strokeLinecap="round" />
        <path d="M84 284v102m195-102v102" stroke="#a9b8ab" strokeWidth="8" strokeLinecap="round" />
        <path d="M70 386h224" stroke="#a9b8ab" strokeWidth="8" strokeLinecap="round" />
      </g>

      <g transform="rotate(7 483 399)">
        <rect x="427" y="354" width="112" height="78" rx="14" fill="#fff" />
        <rect x="439" y="366" width="36" height="36" rx="7" fill="var(--brand-primary, #00b757)" fillOpacity=".1" />
        <path d="M447 374h20v20h-20zm4 4v12m4-12v12m4-12v12m-12-8h20m-20 4h20" stroke="var(--brand-primary, #00b757)" strokeWidth="2" />
        <rect x="484" y="371" width="42" height="6" rx="3" fill="#506157" />
        <rect x="484" y="384" width="31" height="5" rx="2.5" fill="#d4ddd6" />
        <rect x="439" y="411" width="88" height="9" rx="4.5" fill="var(--brand-secondary, #d4fe70)" fillOpacity=".6" />
      </g>

      <path d="M81 178c8-20 16-25 25-23-1 17-8 26-25 23Zm5 7c14-15 24-17 32-12-7 14-17 19-32 12Zm-2-14c-12-13-13-23-7-29 12 9 16 18 7 29Z" fill="var(--brand-primary, #00b757)" fillOpacity=".72" />
      <path d="M94 193c7-15 12-26 18-37" stroke="var(--brand-primary, #00b757)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function PlanIcon({ name }) {
  const paths = {
    'arrow-left': 'M19 12H5m7 7-7-7 7-7',
    'arrow-down': 'M12 5v14m7-7-7 7-7-7',
    'arrow-right': 'M5 12h14m-7-7 7 7-7 7',
    crown: 'm2 8 5 4 5-8 5 8 5-4-2 12H4L2 8Z',
    check: 'm5 12 4 4L19 6',
    orders: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    menu: 'M4 5h16v14H4zM8 9h8M8 13h5',
    tables: 'M3 7h18M5 7v12m14-12v12M8 11h8m-8 4h8',
    settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v2m0 14v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M3 12h2m14 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42',
  };

  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
