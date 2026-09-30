import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ClientsList } from './pages/ClientsList';
import { ClientDetail } from './pages/ClientDetail';
import { ProgressDiscussionView } from './pages/ProgressDiscussionView';
import { EscalationsView } from './pages/EscalationsView';
import { BaselineComparisonView } from './pages/BaselineComparisonView';
import { ExperimentDataView } from './pages/ExperimentDataView';
import { PrivacyView } from './pages/PrivacyView';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      <div>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <ClientsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:id"
              element={
                <ProtectedRoute>
                  <ClientDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/discussion"
              element={
                <ProtectedRoute>
                  <ProgressDiscussionView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/escalations"
              element={
                <ProtectedRoute>
                  <EscalationsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/baseline-comparison"
              element={
                <ProtectedRoute>
                  <BaselineComparisonView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/experiment"
              element={
                <ProtectedRoute>
                  <ExperimentDataView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/privacy"
              element={
                <ProtectedRoute>
                  <PrivacyView />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      <footer className="glass-panel border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        Collaborative Outcome Tracker — Non-Clinical Prototype Demonstrator (Synthetic Data Only)
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
