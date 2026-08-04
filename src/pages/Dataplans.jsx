import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { useUserId } from '../hooks/useUserId';
import './Dataplans.css';

const plans = [
  { id: 1, data: '7.5 GB',    validity: '3 days',  price: 0.49, tag: 'Starter',  color: '#00c9ff' },
  { id: 2, data: '15 GB',     validity: '7 days',  price: 0.99, tag: 'Popular',  color: '#0ef', popular: true },
  { id: 3, data: '35 GB',     validity: '7 days',  price: 1.99, tag: 'Value',    color: '#7df9ff' },
  { id: 4, data: '50 GB',     validity: '21 days', price: 2.99, tag: 'Pro',      color: '#00b4d8' },
  { id: 5, data: '60 GB',     validity: '30 days', price: 4.49, tag: 'Elite',    color: '#48cae4' },
  { id: 6, data: 'Unlimited', validity: '30 days', price: 8.49, tag: 'Ultimate', speed: '15 Mbps', color: '#ade8f4', ultimate: true },
];

export default function DataPlans() {
  const navigate = useNavigate();
  const { userId } = useUserId();
  const { updateSelectedPlan } = useApp();
  const [selected, setSelected] = useState(null);

  const handleSelect = (plan) => {
    setSelected(plan.id);
    updateSelectedPlan(plan);
  };

  const handleProceed = () => {
    if (selected) navigate(`/${userId}/login`);
  };

  return (
    <div className="dp-root">
      {/* Stars background */}
      <div className="dp-stars">
        {[...Array(80)].map((_, i) => (
          <div key={i} className="dp-star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
          }} />
        ))}
      </div>

      {/* Orbit rings */}
      <div className="dp-orbit dp-orbit-1" />
      <div className="dp-orbit dp-orbit-2" />
      <div className="dp-orbit dp-orbit-3" />

      {/* Header */}
      <header className="dp-header">
        <div className="dp-logo-wrap">
          <img src="/logo.png" alt="Econet" className="dp-logo-img" onError={(e) => e.target.style.display='none'} />
          <div className="dp-logo-text">
            <span className="dp-logo-eco">Eco</span><span className="dp-logo-net">net</span>
          </div>
        </div>
        <div className="dp-collab">
          <span className="dp-collab-text">Collaborating with</span>
          <span className="dp-collab-brands">Starlink <span className="dp-x">✕</span> </span>
        </div>
        <div className="dp-tagline">
          Gives you <em>ultimate</em> internet packages
        </div>
      </header>

      {/* Hero */}
      <section className="dp-hero">
        <div className="dp-hero-badge">🛰️ SATELLITE-POWERED INTERNET</div>
        <h1 className="dp-hero-title">Choose Your<br /><span className="dp-hero-accent">Data Bundle</span></h1>
        <p className="dp-hero-sub">Ultra-fast connectivity powered by Starlink low-orbit satellites</p>
      </section>

      {/* Plans grid */}
      <section className="dp-plans">
        {plans.map((plan) => (
          <div key={plan.id} className="dp-card-wrap">
            <div
              className={`dp-card ${selected === plan.id ? 'dp-card--selected' : ''} ${plan.ultimate ? 'dp-card--ultimate' : ''} ${plan.popular ? 'dp-card--popular' : ''}`}
              onClick={() => handleSelect(plan)}
              style={{ '--plan-color': plan.color }}
            >
              {plan.popular  && <div className="dp-badge dp-badge--popular">⭐ Most Popular</div>}
              {plan.ultimate && <div className="dp-badge dp-badge--ultimate">🚀 Best Value</div>}

              <div className="dp-card-top">
                <div className="dp-card-tag">{plan.tag}</div>
                <div className="dp-card-data">
                  {plan.data}
                  {plan.speed && <span className="dp-card-speed">@ {plan.speed}</span>}
                </div>
                <div className="dp-card-validity">Valid for {plan.validity}</div>
              </div>

              <div className="dp-card-bottom">
                <div className="dp-card-price">
                  <span className="dp-price-dollar">$</span>
                  <span className="dp-price-amount">{plan.price.toFixed(2)}</span>
                </div>
                <div className={`dp-card-select ${selected === plan.id ? 'dp-card-select--active' : ''}`}>
                  {selected === plan.id ? '✓ Selected' : 'Select'}
                </div>
              </div>

              <div className="dp-card-glow" />
            </div>

            {/* Proceed button appears right below the selected card */}
            {selected === plan.id && (
              <button
                className="dp-inline-proceed"
                onClick={handleProceed}
                style={{ '--plan-color': plan.color }}
              >
                Proceed with {plan.data} Bundle →
              </button>
            )}
          </div>
        ))}
      </section>

      <footer className="dp-footer">© 2026 Econet × Starlink</footer>
    </div>
  );
}
