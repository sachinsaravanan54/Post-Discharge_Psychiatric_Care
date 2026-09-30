import React from 'react';
import { BarChart2, Play, BookOpen } from 'lucide-react';

export const ExperimentDataView: React.FC = () => {
  return (
    <div className="space-y-8 selection:bg-teal-500 selection:text-white pb-12">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 text-teal-400 text-xs rounded-full border border-teal-500/20 font-semibold mb-2">
          <BarChart2 className="h-3.5 w-3.5" />
          Reproducible Scientific Experiment
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Experiment Data & Results</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Synthetic experiment comparing Attendance-Based outcome tracking against Goal-Based Outcome Tracking.
        </p>
      </div>

      {/* Notebook Link Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-teal-500/40 bg-teal-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Jupyter Notebook Experiment File</h3>
            <p className="text-xs text-slate-300 mt-0.5 font-mono">
              notebooks/experiment.ipynb
            </p>
          </div>
        </div>
        <a
          href="/notebooks/experiment.ipynb"
          target="_blank"
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-teal-600/30 flex items-center gap-1.5"
        >
          <Play className="h-3.5 w-3.5" />
          <span>Open Notebook</span>
        </a>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400">Baseline Result (Attendance Rate)</div>
          <div className="text-3xl font-extrabold text-blue-400 mt-2">72.4%</div>
          <p className="text-xs text-slate-400 mt-1">Mean appointment attendance rate across cohort.</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-teal-500/30">
          <div className="text-xs font-semibold text-slate-400">Prototype Result (Goal Attainment)</div>
          <div className="text-3xl font-extrabold text-teal-400 mt-2">68.5%</div>
          <p className="text-xs text-teal-300 mt-1">Mean goal attainment score with supporting evidence.</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30">
          <div className="text-xs font-semibold text-slate-400">Escalation Mean Reaction Time</div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">&lt; 1 min</div>
          <p className="text-xs text-amber-300 mt-1">Automatic escalation of overdue high-priority actions.</p>
        </div>
      </div>

      {/* Error Analysis & Discrepancy Breakdown */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white">Error Analysis & Discrepancy Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <h3 className="font-bold text-rose-400">Type I Error: Attendance False Positive</h3>
            <p className="text-slate-400 leading-relaxed">
              Occurs when attendance is high (80%+) but actual goal progress is stagnant due to route anxiety or routine barriers. Attendance tracking misclassifies these clients as "Recovered".
            </p>
            <div className="text-white font-bold">Observed Rate: 24.5% of total clients</div>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <h3 className="font-bold text-emerald-400">Type II Error: Attendance False Negative</h3>
            <p className="text-slate-400 leading-relaxed">
              Occurs when attendance is low (&lt;50%) but goal attainment is high (80%+) because client has achieved independent self-management without needing frequent clinical reviews.
            </p>
            <div className="text-white font-bold">Observed Rate: 12.0% of total clients</div>
          </div>
        </div>
      </div>
    </div>
  );
};
