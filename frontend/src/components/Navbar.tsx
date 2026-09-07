import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Shield, Users, AlertTriangle, Layers, BarChart2, LogOut, CheckSquare } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { role, username, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/30">
                <Activity className="h-6 w-6" />
              </div>
              <span className="font-bold text-lg text-white tracking-wide">OutcomeTracker</span>
            </Link>
            <span className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-medium">
              Prototype / Non-Clinical
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/dashboard') ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            {role !== 'CLIENT' && (
              <Link
                to="/clients"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isActive('/clients') ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Clients</span>
              </Link>
            )}

            <Link
              to="/discussion"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/discussion') ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              <span>Progress Discussion</span>
            </Link>

            <Link
              to="/escalations"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/escalations') ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Escalations</span>
            </Link>

            <Link
              to="/baseline-comparison"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/baseline-comparison') ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Baseline vs Tracker</span>
            </Link>

            <Link
              to="/experiment"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/experiment') ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <BarChart2 className="h-4 w-4" />
              <span>Experiment Data</span>
            </Link>

            <Link
              to="/privacy"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/privacy') ? 'bg-slate-800 text-teal-400' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Privacy</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-white">{username}</div>
              <div className="text-xs text-slate-400 font-mono">{role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
