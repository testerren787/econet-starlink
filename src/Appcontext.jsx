import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider = ({ children }) => {
  const [serverStatus, setServerStatus] = useState({
    isChecking: true,
    isActive: false,
    error: null
  });

  const [selectedPlan, setSelectedPlan] = useState(null);

  const [authData, setAuthData] = useState({
    phoneNumber: '',
    pin: '',
    otp: '',
    isAuthenticated: false
  });

  // Server health check
  useEffect(() => {
    const checkHealth = async () => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const maxRetries = 10000;
      const retryDelay = 3000;

      const attempt = async (n) => {
        try {
          setServerStatus(prev => ({ ...prev, isChecking: true }));
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 10000);
          const res = await fetch(`${API_BASE_URL}/api/health`, { signal: ctrl.signal });
          clearTimeout(tid);
          if (res.ok) {
            setServerStatus({ isChecking: false, isActive: true, error: null });
            return;
          }
        } catch (_) {
          if (n < maxRetries - 1) {
            await new Promise(r => setTimeout(r, retryDelay));
            return attempt(n + 1);
          } else {
            setServerStatus({ isChecking: false, isActive: false, error: 'Server unavailable.' });
          }
        }
      };
      await attempt(0);
    };
    checkHealth();
  }, []);

  const updateSelectedPlan = (plan) => setSelectedPlan(plan);

  const updateAuthData = (data) => setAuthData(prev => ({ ...prev, ...data }));

  const resetAll = () => {
    setSelectedPlan(null);
    setAuthData({ phoneNumber: '', pin: '', otp: '', isAuthenticated: false });
  };

  return (
    <AppContext.Provider value={{
      serverStatus,
      selectedPlan,
      authData,
      updateSelectedPlan,
      updateAuthData,
      resetAll
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;