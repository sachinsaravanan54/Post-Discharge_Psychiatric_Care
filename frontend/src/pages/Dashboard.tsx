import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardMetrics, Role } from '../types';
import {
  Users, Target, AlertTriangle, Activity, TrendingUp,
  Clock, ArrowUpRight, CheckSquare, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { role, username, switchRolePreview } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-8 selection:bg-teal-500 selection:text-white pb-12">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 text-teal-400 text-xs rounded-full border border-teal-500/20 font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            Post-Discharge Psychiatric Care Outcome Tracker
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, {username} <span className="text-xs px-2.5 py-0.5 bg-slate-800 text-teal-400 border border-slate-700 rounded-full font-mono">{role}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Shifting outcome measurement from passive appointment attendance rates to collaborative, client-defined recovery goals.
          </p>
        </div>

        {/* Role Switcher Preview */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Role View Switcher</div>
          <div className="flex items-center gap-2">
            {(['CLIENT', 'CLINICIAN', 'SUPERVISOR'] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => switchRolePreview(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  role === r
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overdue / High Priority Escalation Banner */}
      {metrics && metrics.unresolved_high_priority_actions_count > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/40 bg-rose-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-300">
                {metrics.unresolved_high_priority_actions_count} Unresolved High-Priority Follow-Up Actions
              </h3>
              <p className="text-xs text-rose-200/70 mt-0.5">
                {metrics.overdue_actions_count} actions are currently overdue and have triggered automatic escalation levels.
              </p>
            </div>
          </div>
          <Link
            to="/escalations"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-rose-600/30 whitespace-nowrap"
          >
            Manage Escalations &rarr;
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Clients</span>
            <Users className="h-5 w-5 text-teal-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">
            {loading ? '...' : metrics?.total_active_clients}
          </div>
          <div className="text-xs text-slate-400 mt-1">Synthetic participant cohort</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Recovery Goals</span>
            <Target className="h-5 w-5 text-teal-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">
            {loading ? '...' : metrics?.total_active_goals}
          </div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{metrics?.goals_improving_count} Goals Improving</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Goal Progress Rate</span>
            <Activity className="h-5 w-5 text-teal-400" />
          </div>
          <div className="text-3xl font-extrabold text-teal-400 mt-3">
            {loading ? '...' : `${metrics?.goal_progress_rate}%`}
          </div>
          <div className="text-xs text-slate-400 mt-1">Client-defined meaningful outcomes</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Attendance Rate Baseline</span>
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-blue-400 mt-3">
            {loading ? '...' : `${metrics?.attendance_rate}%`}
          </div>
          <div className="text-xs text-slate-400 mt-1">Session attendance metric</div>
        </div>
      </div>

      {/* Visual Comparison & Quick Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance vs Goal Outcome Comparison Card */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Outcome Measurement Paradigm Comparison</h2>
              <p className="text-xs text-slate-400">Attendance Tracking vs. Collaborative Goal Progress</p>
            </div>
            <Link
              to="/baseline-comparison"
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">Attendance Baseline Metric</div>
              <div className="text-2xl font-bold text-white">{metrics?.attendance_rate}%</div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${metrics?.attendance_rate || 0}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                Tracks whether appointments were attended. Fails to register if client's daily anxiety or travel barriers persist.
              </p>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-teal-500/30 space-y-2">
              <div className="text-xs font-bold text-teal-400 uppercase tracking-wider">Collaborative Goal Progress</div>
              <div className="text-2xl font-bold text-white">{metrics?.goal_progress_rate}%</div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-400 h-full rounded-full" style={{ width: `${metrics?.goal_progress_rate || 0}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                Directly measures target accomplishment (bus journeys, sleep quality, self-management) with verified evidence.
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs leading-relaxed">
            <strong>Key Insight:</strong> Synthetic evaluation demonstrates that 24.5% of clients with high attendance (80%+) had stagnant goal progress due to unaddressed route anxiety or routine barriers. Attendance alone is not a valid proxy for recovery.
          </div>
        </div>

        {/* Workflow Shortcuts Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Key Workflows</h2>
            <p className="text-xs text-slate-400 mb-4">Execute collaborative outcome management tasks.</p>

            <div className="space-y-3">
              <Link
                to="/discussion"
                className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 rounded-xl block transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckSquare className="h-5 w-5 text-teal-400" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                        Progress Discussion Workflow
                      </div>
                      <div className="text-[11px] text-slate-400">Collaboratively review target, evidence & action</div>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-teal-400" />
                </div>
              </Link>

              {role !== 'CLIENT' && (
                <Link
                  to="/clients"
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 rounded-xl block transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-teal-400" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                          Client Roster & Goals
                        </div>
                        <div className="text-[11px] text-slate-400">View client goals, baseline/target values</div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-teal-400" />
                  </div>
                </Link>
              )}

              <Link
                to="/escalations"
                className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 rounded-xl block transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                        Follow-Up Action Manager
                      </div>
                      <div className="text-[11px] text-slate-400">Track high-priority actions & escalation levels</div>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-teal-400" />
                </div>
              </Link>
            </div>
          </div>

          <button
            onClick={fetchMetrics}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Scan Escalation Engine & Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
