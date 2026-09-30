import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Goal, Client } from '../types';
import {
  Plus, Target, ChevronLeft, X
} from 'lucide-react';

export const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState<Goal | null>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState<Goal | null>(null);

  // Form states
  const [goalText, setGoalText] = useState('');
  const [goalCategory, setGoalCategory] = useState('Independent Travel');
  const [baselineValue, setBaselineValue] = useState<string>('0');
  const [targetValue, setTargetValue] = useState<string>('4');
  const [unit, setUnit] = useState('journeys/month');
  const [measurementMethod] = useState('count');
  const [importanceRating] = useState<number>(8);
  const [formError, setFormError] = useState<string | null>(null);

  // Progress Form State
  const [progressVal, setProgressVal] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(7);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [barrierPresent, setBarrierPresent] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Adjustment Form State
  const [adjText, setAdjText] = useState('');

  const fetchClientAndGoals = async () => {
    try {
      setLoading(true);
      const [clientRes, goalsRes] = await Promise.all([
        api.get(`/clients/${id}`),
        api.get(`/goals?client_id=${id}`)
      ]);
      setClient(clientRes.data);
      setGoals(goalsRes.data);
    } catch (err) {
      console.error('Error fetching client details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientAndGoals();
  }, [id]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const bVal = baselineValue !== '' ? parseFloat(baselineValue) : null;
      const tVal = targetValue !== '' ? parseFloat(targetValue) : null;

      await api.post('/goals', {
        client_id: Number(id),
        goal_text: goalText,
        goal_category: goalCategory,
        baseline_value: bVal,
        target_value: tVal,
        unit: unit,
        measurement_method: measurementMethod,
        importance_rating: Number(importanceRating),
        is_increasing: true
      });

      setShowGoalModal(false);
      setGoalText('');
      fetchClientAndGoals();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to create goal');
    }
  };

  const handleRecordProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showProgressModal) return;
    setProgressError(null);

    try {
      await api.post(`/goals/${showProgressModal.id}/progress`, {
        goal_id: showProgressModal.id,
        reported_by: role || 'CLIENT',
        progress_value: parseFloat(progressVal),
        evidence_note: evidenceNote,
        confidence: Number(confidence),
        barrier_present: barrierPresent
      });

      setShowProgressModal(null);
      setProgressVal('');
      setEvidenceNote('');
      fetchClientAndGoals();
    } catch (err: any) {
      setProgressError(err.response?.data?.detail || 'Failed to record progress');
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdjustmentModal) return;
    try {
      await api.post(`/goals/${showAdjustmentModal.id}/adjustments`, {
        goal_id: showAdjustmentModal.id,
        description: adjText,
        agreed_by_clinician: true,
        agreed_by_client: false
      });
      setShowAdjustmentModal(null);
      setAdjText('');
      fetchClientAndGoals();
    } catch (err) {
      console.error('Failed to propose adjustment', err);
    }
  };



  if (loading) {
    return <div className="glass-panel p-8 text-center text-xs text-slate-400 rounded-2xl">Loading client workspace...</div>;
  }

  if (!client) {
    return <div className="glass-panel p-8 text-center text-xs text-rose-400 rounded-2xl">Client not found</div>;
  }

  return (
    <div className="space-y-8 selection:bg-teal-500 selection:text-white pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/clients" className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 mb-2 font-semibold">
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Roster</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{client.display_name_or_alias}</h1>
            <span className="px-2.5 py-0.5 bg-slate-800 text-teal-400 border border-slate-700 rounded-full font-mono text-xs">
              {client.synthetic_client_id}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowGoalModal(true)}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-teal-600/30 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Collaboratively Define New Goal</span>
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Target className="h-5 w-5 text-teal-400" />
          <span>Active Client-Defined Goals ({goals.length})</span>
        </h2>

        {goals.length === 0 ? (
          <div className="glass-panel p-8 text-center text-xs text-slate-400 rounded-2xl">
            No goals created for this client yet. Click above to define a meaningful recovery target.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {goals.map((goal) => (
              <div key={goal.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">{goal.goal_category}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        goal.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        goal.status === 'Needs Review' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        goal.status === 'Needs measurement definition' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                      }`}>
                        {goal.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">{goal.goal_text}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowProgressModal(goal)}
                      className="px-3 py-1.5 bg-teal-600/90 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-md shadow-teal-600/20"
                    >
                      Record Measured Result
                    </button>
                    <button
                      onClick={() => setShowAdjustmentModal(goal)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition-colors"
                    >
                      Propose Adjustment
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Baseline/Target Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                  <div>
                    <div className="text-[11px] text-slate-400">Baseline Value</div>
                    <div className="text-sm font-bold text-slate-200">
                      {goal.baseline_value !== null ? `${goal.baseline_value} ${goal.unit || ''}` : 'Unset'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Current Measured Result</div>
                    <div className="text-sm font-bold text-teal-400">
                      {goal.latest_progress_value !== undefined && goal.latest_progress_value !== null
                        ? `${goal.latest_progress_value} ${goal.unit || ''}`
                        : 'No entries yet'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Target Value</div>
                    <div className="text-sm font-bold text-slate-200">
                      {goal.target_value !== null ? `${goal.target_value} ${goal.unit || ''}` : 'Unset'}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="sm:col-span-3 space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Goal Attainment Score</span>
                      <span className="text-teal-400 font-bold">{goal.latest_progress_percentage ?? 0}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${goal.latest_progress_percentage ?? 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Collaborative Discussion View Link */}
                <div className="flex justify-end">
                  <Link
                    to="/discussion"
                    className="text-xs text-teal-400 hover:text-teal-300 font-semibold inline-flex items-center gap-1"
                  >
                    <span>Launch Progress Discussion Workflow &rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Collaboratively Define Goal</h3>
              <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Goal Description (Meaningful Recovery Target)</label>
                <input
                  type="text"
                  placeholder="e.g. Travel independently on local bus"
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Independent Travel">Independent Travel</option>
                    <option value="Sleep Routine">Sleep Routine</option>
                    <option value="Social Connection">Social Connection</option>
                    <option value="Daily Routine Management">Daily Routine Management</option>
                    <option value="Volunteering">Volunteering</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    placeholder="e.g. journeys/month"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Baseline Value</label>
                  <input
                    type="number"
                    step="any"
                    value={baselineValue}
                    onChange={(e) => setBaselineValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Value</label>
                  <input
                    type="number"
                    step="any"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-teal-600/30"
              >
                Save Goal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Progress Entry Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Record Progress: {showProgressModal.goal_text}</h3>
              <button onClick={() => setShowProgressModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {progressError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs">
                {progressError}
              </div>
            )}

            <form onSubmit={handleRecordProgress} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Current Measured Result ({showProgressModal.unit || 'units'})
                </label>
                <input
                  type="number"
                  step="any"
                  value={progressVal}
                  onChange={(e) => setProgressVal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Self-Reported Confidence Rating (1 - 10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Client-Defined Evidence Note</label>
                <textarea
                  rows={2}
                  placeholder="Describe supporting evidence (e.g., bus tickets, self-journal entry)"
                  value={evidenceNote}
                  onChange={(e) => setEvidenceNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="barrierCheck"
                  checked={barrierPresent}
                  onChange={(e) => setBarrierPresent(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0"
                />
                <label htmlFor="barrierCheck" className="font-semibold text-slate-300">
                  Flag active barrier during this period
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-teal-600/30"
              >
                Submit Measured Progress
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Proposed Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Propose Goal Adjustment</h3>
              <button onClick={() => setShowAdjustmentModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Adjustment Description</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Reduce target to 2 journeys/week and add peer support escort"
                  value={adjText}
                  onChange={(e) => setAdjText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-teal-600/30"
              >
                Propose Adjustment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
