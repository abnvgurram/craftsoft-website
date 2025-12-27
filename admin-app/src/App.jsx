
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import theme from './theme';
import Signin from './pages/Signin';
import Layout from './components/layout/Layout';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/signin" replace />;
  return <Layout />;
};

const Dashboard = () => (
  <div style={{ textAlign: 'center', marginTop: 50 }}>
    <h2>🚧 Under Construction 🚧</h2>
    <p>The dashboard is being migrated to React.</p>
  </div>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter basename="/admin">
          <Routes>
            <Route path="/signin" element={<Signin />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/students" element={<h2>Students Page</h2>} />
              <Route path="/tutors" element={<h2>Tutors Page</h2>} />
              <Route path="/inquiries" element={<h2>Inquiries Page</h2>} />
              <Route path="/payments" element={<h2>Payments Page</h2>} />
              <Route path="/services" element={<h2>Services Page</h2>} />
              <Route path="/website" element={<h2>Website Config Page</h2>} />
              <Route path="/settings" element={<h2>Settings Page</h2>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
