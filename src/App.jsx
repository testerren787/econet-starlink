import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './AppContext';
import DataPlans from './pages/Dataplans';
import Login from './pages/Login';
import Status from './pages/Status';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DataPlans />} />
          <Route path="/login" element={<Login />} />
          <Route path="/status" element={<Status />} />
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}