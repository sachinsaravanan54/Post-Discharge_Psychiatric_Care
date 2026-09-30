import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BaselineComparisonResponse } from '../types';
import { Layers, AlertTriangle, TrendingUp } from 'lucide-react';

export const BaselineComparisonView: React.FC = () => {
  const [data, setData] = useState<BaselineComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/comparison');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, []);

  if (loading || !data) {
    return <div className="glass-panel p-8 text-center text-xs text-slate-400 rounded-2xl">Computing baseline comparison dataset...</div>;
  }

  const { cohort_summary, clients } = data;

  return (
    <div className="space-y-8 selection:bg-teal-500 selection:text-white pb-12">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 text-teal-400 text-xs rounded-full border border-teal-500/20 font-semibold mb-2">
          <Layers className="h-3.5 w-3.5" />
          Outcome Measurement Evaluation
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Attendance Baseline vs. Goal-Based Tracker
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Comparing traditional attendance-focused tracking against collaborative goal-defined outcome tracking across {cohort_summary.total_clients} synthetic discharge participants.
        </p>
      </div>

      {/* Summary KPI Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400">Cohort Attendance Rate</div>
          <div className="text-3xl font-extrabold text-blue-400 mt-2">{cohort_summary.average_attendance_rate}%</div>
          <div className="text-xs text-slate-400 mt-1">Traditional Baseline Metric</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-teal-500/30">
          <div className="text-xs font-semibold text-slate-400">Goal Attainment Score</div>
          <div className="text-3xl font-extrabold text-teal-400 mt-2">{cohort_summary.average_goal_progress_rate}%</div>
          <div className="text-xs text-teal-300 mt-1">Goal-Based Outcome Tracker</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400">Divergence / Discrepancy Metric</div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">{cohort_summary.discrepancy_metric}%</div>
          <div className="text-xs text-slate-400 mt-1">Abs. difference between metrics</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30">
          <div className="text-xs font-semibold text-slate-400">Attendance False Positive Rate</div>
          <div className="text-3xl font-extrabold text-rose-400 mt-2">{cohort_summary.attendance_false_positive_rate}%</div>
          <div className="text-xs text-rose-300 mt-1">High attendance, stalled progress</div>
        </div>
      </div>

      {/* Deep-Dive Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 space-y-3">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="h-5 w-5" />
            <span>Scenario A: High Attendance, Zero Goal Progress (False Positive)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Client attends 100% of outpatient reviews, but remains unable to travel independently or complete morning sleep routines due to unaddressed route anxiety.
          </p>
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-400">
            <strong>Traditional View:</strong> 100% Success<br />
            <strong>Goal Tracker View:</strong> 0% Progress (Active Barrier Flagged)
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-teal-500/30 space-y-3">
          <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm">
            <TrendingUp className="h-5 w-5" />
            <span>Scenario B: Low Attendance, High Goal Progress (False Negative)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Client attends only 40% of scheduled appointments due to starting a volunteer job, but achieves 85% of self-defined travel and daily routine goals independently.
          </p>
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-400">
            <strong>Traditional View:</strong> 40% Failure / At Risk<br />
            <strong>Goal Tracker View:</strong> 85% Recovery Target Attained
          </div>
        </div>
      </div>

      {/* Participant Comparison Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white">Participant Sample Evaluation ({clients.length} Clients)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Synthetic Client</th>
                <th className="py-3 px-4 font-semibold">Attendance Rate</th>
                <th className="py-3 px-4 font-semibold">Goal Progress Rate</th>
                <th className="py-3 px-4 font-semibold">Discrepancy</th>
                <th className="py-3 px-4 font-semibold">Classification Scenario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {clients.slice(0, 20).map((c) => (
                <tr key={c.client_id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-white font-mono">{c.synthetic_client_id} ({c.display_name_or_alias})</td>
                  <td className="py-3 px-4 text-blue-400 font-semibold">{c.attendance_rate}%</td>
                  <td className="py-3 px-4 text-teal-400 font-semibold">{c.goal_progress_rate}%</td>
                  <td className="py-3 px-4 text-amber-400 font-semibold">{c.discrepancy}%</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.scenario.includes('False Positive') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      c.scenario.includes('False Negative') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {c.scenario}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
