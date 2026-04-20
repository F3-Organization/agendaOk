import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth.store';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { AppointmentsPage } from '../pages/AppointmentsPage';
import { WhatsAppPage } from '../pages/WhatsAppPage';
import { SubscriptionPage } from '../pages/SubscriptionPage';
import { SettingsPage } from '../pages/SettingsPage';
import { GoogleCallbackPage } from '../pages/GoogleCallbackPage';
import { EmailVerificationPage } from '../pages/EmailVerificationPage';
import { LandingPage } from '../pages/LandingPage';
import { TwoFactorLoginPage } from '../pages/TwoFactorLoginPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { SelectCompanyPage } from '../pages/SelectCompanyPage';
import { CreateCompanyPage } from '../pages/CreateCompanyPage';
import { CompanySettingsPage } from '../pages/CompanySettingsPage';
import { ProfessionalsPage } from '../pages/ProfessionalsPage';
import { BotConfigPage } from '../pages/BotConfigPage';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicyPage';
import { TermsOfServicePage } from '../pages/TermsOfServicePage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminCompaniesPage } from '../pages/admin/AdminCompaniesPage';

export const AppRouter = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const selectedCompany = useAuthStore((state) => state.selectedCompany);
  const user = useAuthStore((state) => state.user);
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/verify" element={<EmailVerificationPage />} />
      <Route path="/auth/2fa" element={<TwoFactorLoginPage />} />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />

      {/* Authenticated but company not yet selected */}
      <Route
        path="/select-company"
        element={isAuthenticated ? <SelectCompanyPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/create-company"
        element={isAuthenticated ? <CreateCompanyPage /> : <Navigate to="/login" />}
      />

      <Route
        path="/checkout"
        element={isAuthenticated ? <CheckoutPage /> : <Navigate to="/login" />}
      />

      {/* Protected routes — require authenticated + selectedCompany */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated
            ? selectedCompany
              ? <DashboardPage />
              : <Navigate to="/select-company" />
            : <Navigate to="/login" />
        }
      />
      <Route
        path="/appointments"
        element={
          isAuthenticated
            ? selectedCompany
              ? <AppointmentsPage />
              : <Navigate to="/select-company" />
            : <Navigate to="/login" />
        }
      />
      <Route
        path="/whatsapp"
        element={
          isAuthenticated
            ? selectedCompany
              ? <WhatsAppPage />
              : <Navigate to="/select-company" />
            : <Navigate to="/login" />
        }
      />
      <Route
        path="/subscription"
        element={
          isAuthenticated
            ? selectedCompany
              ? <SubscriptionPage />
              : <Navigate to="/select-company" />
            : <Navigate to="/login" />
        }
      />
      <Route
        path="/settings"
        element={
          isAuthenticated
            ? selectedCompany
              ? <SettingsPage />
              : <Navigate to="/select-company" />
            : <Navigate to="/login" />
        }
      />
      <Route
        path="/company/settings"
        element={
          isAuthenticated
            ? selectedCompany
              ? <CompanySettingsPage />
              : <Navigate to="/select-company" />
            : <Navigate to="/login" />
        }
      />
      <Route
        path="/professionals"
        element={
          isAuthenticated
            ? selectedCompany
              ? <ProfessionalsPage />
              : <Navigate to="/select-company" />
            : <Navigate to="/login" />
        }
      />
      <Route
        path="/bot-config"
        element={
          isAuthenticated
            ? selectedCompany
              ? <BotConfigPage />
              : <Navigate to="/select-company" />
            : <Navigate to="/login" />
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={isAdmin ? <AdminDashboardPage /> : <Navigate to="/" />}
      />
      <Route
        path="/admin/users"
        element={isAdmin ? <AdminUsersPage /> : <Navigate to="/" />}
      />
      <Route
        path="/admin/companies"
        element={isAdmin ? <AdminCompaniesPage /> : <Navigate to="/" />}
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
