import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './AppContext';
import DataPlans from './pages/Dataplans';
import Login from './pages/Login';
import Status from './pages/Status';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/:userId"        element={<DataPlans />} />
          <Route path="/:userId/login"  element={<Login />} />
          <Route path="/:userId/status" element={<Status />} />
          <Route path="*"               element={<DataPlans />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
