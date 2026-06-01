import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Layout from './Layout';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import Dashboard from './Dashboard';
import CRM from './CRM';
import Inventory from './Inventory';
import Quotations from './Quotations';
import Sales from './Sales';
import SII from './SII';
import Settings from './Settings';
import SEO from './SEO';
import Finance from './Finance';
import Seguimiento from './Seguimiento';
import WebQuotations from './WebQuotations';
import Deliveries from './Deliveries';
import CaClientes from './CaClientes';
import CaProyectos from './CaProyectos';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '10px', fontSize: '14px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route
            path="/login"
            element={<PublicRoute><LoginPage /></PublicRoute>}
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="crm" element={<CRM />} />
            <Route path="seguimiento" element={<Seguimiento />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="sales" element={<Sales />} />
            <Route path="sii" element={<SII />} />
            <Route path="settings" element={<Settings />} />
            <Route path="seo" element={<SEO />} />
            <Route path="finance" element={<Finance />} />
            <Route path="web-quotes" element={<WebQuotations />} />
            <Route path="deliveries" element={<Deliveries />} />
            <Route path="ca-clientes" element={<CaClientes />} />
            <Route path="ca-proyectos" element={<CaProyectos />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
