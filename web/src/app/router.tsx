import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth.store';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { WhatsAppPage } from '../pages/WhatsAppPage';
import { SubscriptionPage } from '../pages/SubscriptionPage';
import { GoogleCallbackPage } from '../pages/GoogleCallbackPage';
import { EmailVerificationPage } from '../pages/EmailVerificationPage';
import { LandingPage } from '../pages/LandingPage';

export const AppRouter = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/verify" element={<EmailVerificationPage />} />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/whatsapp" 
        element={isAuthenticated ? <WhatsAppPage /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/subscription" 
        element={isAuthenticated ? <SubscriptionPage /> : <Navigate to="/login" />} 
      />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
