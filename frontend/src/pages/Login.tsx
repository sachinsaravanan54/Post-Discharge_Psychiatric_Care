import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Activity, ShieldCheck, Stethoscope, User } from 'lucide-react';
import { Role } from '../types';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('clinician1');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { username, password });
      const { access_token, role, username: uName, synthetic_client_id } = res.data;

      login(access_token, {
        username: uName,
        role: role as Role,
        synthetic_client_id,
        display_name: uName
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetLogin = (presetUsername: string) => {
    setUsername(presetUsername);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 selection:bg-teal-500 selection:text-white">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30 mb-2">
            <Activity className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Post-Discharge Care Tracker</h2>
          <p className="text-xs text-slate-400">
            Goal-Based Outcome Tracking vs. Traditional Attendance Tracking
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-teal-600/30 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="border-t border-slate-800 pt-5 space-y-3">
          <div className="text-xs font-semibold text-slate-400 text-center uppercase tracking-wider">
            Quick Demo Sign-In
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handlePresetLogin('client1')}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all hover:border-teal-500/40"
            >
              <User className="h-4 w-4 text-emerald-400 mb-1" />
              <div className="text-xs font-bold text-white">Client</div>
              <div className="text-[10px] text-slate-400">client1</div>
            </button>

            <button
              onClick={() => handlePresetLogin('clinician1')}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all hover:border-teal-500/40"
            >
              <Stethoscope className="h-4 w-4 text-teal-400 mb-1" />
              <div className="text-xs font-bold text-white">Clinician</div>
              <div className="text-[10px] text-slate-400">clinician1</div>
            </button>

            <button
              onClick={() => handlePresetLogin('supervisor1')}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all hover:border-teal-500/40"
            >
              <ShieldCheck className="h-4 w-4 text-amber-400 mb-1" />
              <div className="text-xs font-bold text-white">Supervisor</div>
              <div className="text-[10px] text-slate-400">supervisor1</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
