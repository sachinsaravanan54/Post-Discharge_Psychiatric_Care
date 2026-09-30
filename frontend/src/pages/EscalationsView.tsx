import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FollowUpAction } from '../types';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const EscalationsView: React.FC = () => {
  const { role } = useAuth();
  const [actions, setActions] = useState<FollowUpAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  const fetchActions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/actions');
      setActions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleMarkComplete = async (actionId: number) => {
    try {
      await api.patch(`/actions/${actionId}`, { status: 'Completed' });
      fetchActions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualEscalate = async (actionId: number) => {
    const reason = prompt('Enter escalation reason for supervisor review:', 'Urgent client follow-up required');
    if (!reason) return;
    try {
      await api.post(`/actions/${actionId}/escalate`, { escalation_reason: reason });
      fetchActions();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredActions = actions.filter((a) => {
    if (filterPriority === 'HIGH') return a.priority === 'High';
    if (filterPriority === 'OVERDUE') return a.status === 'Overdue';
    if (filterPriority === 'ESCALATED') return a.escalated;
    return true;
  });

  return (
    <div className="space-y-8 selection:bg-teal-500 selection:text-white pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 text-rose-400 text-xs rounded-full border border-rose-500/20 font-semibold mb-2">
            <ShieldAlert className="h-3.5 w-3.5" />
            Follow-Up Action Manager & Escalation Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Escalation Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Guaranteeing no unresolved high-priority action disappears from post-discharge care.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          {['ALL', 'HIGH', 'OVERDUE', 'ESCALATED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterPriority(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterPriority === f
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-8 text-center text-xs text-slate-400 rounded-2xl">
          Scanning follow-up action queue...
        </div>
      ) : filteredActions.length === 0 ? (
        <div className="glass-panel p-8 text-center text-xs text-slate-400 rounded-2xl">
          No follow-up actions match the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActions.map((action) => (
            <div
              key={action.id}
              className={`glass-panel p-5 rounded-2xl border transition-all ${
                action.status === 'Overdue' || action.escalated
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      action.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      action.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {action.priority} Priority
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      action.status === 'Overdue' ? 'bg-rose-600 text-white animate-pulse' :
                      action.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                    }`}>
                      {action.status}
                    </span>

                    {action.escalated && (
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold">
                        Escalated Level {action.escalation_level}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white">{action.description}</h3>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-400 pt-1">
                    <div>Owner: <strong className="text-slate-200">{action.owner_role} ({action.owner_id})</strong></div>
                    <div>Due Date: <strong className="text-slate-200">{new Date(action.due_date).toLocaleDateString()}</strong></div>
                    <div>Created: <span className="text-slate-400">{new Date(action.created_at).toLocaleDateString()}</span></div>
                  </div>

                  {action.escalation_reason && (
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-rose-500/30 text-rose-300 text-xs font-mono">
                      <strong>Escalation Audit Note:</strong> {action.escalation_reason}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {action.status !== 'Completed' && (
                    <button
                      onClick={() => handleMarkComplete(action.id)}
                      className="px-3.5 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20"
                    >
                      Mark Completed
                    </button>
                  )}

                  {role !== 'CLIENT' && action.status !== 'Completed' && (
                    <button
                      onClick={() => handleManualEscalate(action.id)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
                    >
                      Escalate Higher
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
