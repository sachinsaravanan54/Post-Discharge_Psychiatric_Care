import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Goal, Client } from '../types';

import {
  Plus, Target, ChevronLeft, X, Edit3, Trash2, AlertTriangle, CheckCircle2, ShieldAlert
} from 'lucide-react';

export const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEditGoalModal, setShowEditGoalModal] = useState<Goal | null>(null);
  const [showProgressModal, setShowProgressModal] = useState<Goal | null>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState<Goal | null>(null);
  const [showBarrierModal, setShowBarrierModal] = useState<Goal | null>(null);

  // Goal Form states
  const [goalText, setGoalText] = useState('');
  const [goalCategory, setGoalCategory] = useState('Independent Travel');
  const [baselineValue, setBaselineValue] = useState<string>('0');
  const [targetValue, setTargetValue] = useState<string>('4');
  const [unit, setUnit] = useState('journeys/month');
  const [measurementMethod] = useState('count');
  const [importanceRating] = useState<number>(8);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Goal Form states
  const [editGoalText, setEditGoalText] = useState('');
  const [editBaseline, setEditBaseline] = useState<string>('');
  const [editTarget, setEditTarget] = useState<string>('');
  const [editUnit, setEditUnit] = useState('');
  const [editStatus, setEditStatus] = useState('Active');

  // Progress Form State
  const [progressVal, setProgressVal] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(7);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [barrierPresent, setBarrierPresent] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Adjustment Form State
  const [adjText, setAdjText] = useState('');

  // Barrier Form State
  const [barrierDesc, setBarrierDesc] = useState('');
  const [barrierSeverity, setBarrierSeverity] = useState('Medium');

  const fetchClientAndGoals = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [clientRes, goalsRes] = await Promise.all([
        api.get(`/clients/${id}`),
        api.get(`/goals?client_id=${id}`)
      ]);
      setClient(clientRes.data);
      setGoals(goalsRes.data);
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
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
      setSuccessMsg('Successfully created recovery goal.');
      fetchClientAndGoals();
    } catch (err: any) {
      setFormError(getApiErrorMessage(err));
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditGoalModal) return;
    try {
      const bVal = editBaseline !== '' ? parseFloat(editBaseline) : null;
      const tVal = editTarget !== '' ? parseFloat(editTarget) : null;

      await api.patch(`/goals/${showEditGoalModal.id}`, {
        goal_text: editGoalText,
        baseline_value: bVal,
        target_value: tVal,
        unit: editUnit,
        status: editStatus
      });

      setShowEditGoalModal(null);
      setSuccessMsg('Goal updated successfully.');
      fetchClientAndGoals();
    } catch (err: any) {
      setErrorMsg(getApiErrorMessage(err));
    }
  };

  const handleDeleteGoal = async (goalId: number, text: string) => {
    if (!window.confirm(`Are you sure you want to delete goal: "${text}"?`)) return;
    try {
      await api.delete(`/goals/${goalId}`);
      setSuccessMsg('Goal removed successfully.');
      fetchClientAndGoals();
    } catch (err: any) {
      setErrorMsg(getApiErrorMessage(err));
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
      setSuccessMsg('Progress entry recorded successfully.');
      fetchClientAndGoals();
    } catch (err: any) {
      setProgressError(getApiErrorMessage(err));
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
      setSuccessMsg('Adjustment proposal created.');
      fetchClientAndGoals();
    } catch (err: any) {
      setErrorMsg(getApiErrorMessage(err));
    }
  };

  const handleCreateBarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showBarrierModal) return;
    try {
      await api.post(`/goals/${showBarrierModal.id}/barriers`, {
        goal_id: showBarrierModal.id,
        description: barrierDesc,
        severity: barrierSeverity
      });
      setShowBarrierModal(null);
      setBarrierDesc('');
      setSuccessMsg('Barrier flagged for care team review.');
      fetchClientAndGoals();
    } catch (err: any) {
      setErrorMsg(getApiErrorMessage(err));
    }
  };

  const openEditGoalModal = (goal: Goal) => {
    setShowEditGoalModal(goal);
    setEditGoalText(goal.goal_text);
    setEditBaseline(goal.baseline_value !== null && goal.baseline_value !== undefined ? String(goal.baseline_value) : '');
    setEditTarget(goal.target_value !== null && goal.target_value !== undefined ? String(goal.target_value) : '');
    setEditUnit(goal.unit || '');
    setEditStatus(goal.status);
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

        {role !== 'CLIENT' && (
          <button
            onClick={() => setShowGoalModal(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-teal-600/30 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Collaboratively Define New Goal</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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

                  <div className="flex items-center gap-2 flex-wrap">
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
                    <button
                      onClick={() => setShowBarrierModal(goal)}
                      className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-xs rounded-lg transition-colors"
                    >
                      Flag Barrier
                    </button>
                    {role !== 'CLIENT' && (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          title="Edit Goal"
                          onClick={() => openEditGoalModal(goal)}
                          className="p-1.5 text-slate-400 hover:text-teal-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="Delete Goal"
                          onClick={() => handleDeleteGoal(goal.id, goal.goal_text)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating Discrepancy Alert Banner */}
                {goal.has_rating_discrepancy && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-400" />
                      <span>Collaborative Review Required — Conflicting Progress Ratings</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      {goal.rating_discrepancy_note || 'Client self-reported rating diverges significantly from clinician assessment. Both perspectives are preserved separately without overwriting; collaborative care review is required.'}
                    </p>
                  </div>
                )}


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

      {/* Edit Goal Modal */}
      {showEditGoalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Edit Goal: {showEditGoalModal.goal_text}</h3>
              <button onClick={() => setShowEditGoalModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateGoal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Goal Description</label>
                <input
                  type="text"
                  required
                  value={editGoalText}
                  onChange={(e) => setEditGoalText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Baseline Value</label>
                  <input
                    type="number"
                    step="any"
                    value={editBaseline}
                    onChange={(e) => setEditBaseline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Value</label>
                  <input
                    type="number"
                    step="any"
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Needs Review">Needs Review</option>
                    <option value="Needs measurement definition">Needs measurement definition</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-teal-600/30"
              >
                Save Goal Updates
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Flag Barrier Modal */}
      {showBarrierModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Flag Barrier for Goal</h3>
              <button onClick={() => setShowBarrierModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBarrier} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Barrier Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Panic attack experienced at route 4 interchange; client avoided subsequent travel"
                  value={barrierDesc}
                  onChange={(e) => setBarrierDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Severity</label>
                <select
                  value={barrierSeverity}
                  onChange={(e) => setBarrierSeverity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-amber-600/30"
              >
                Submit Barrier Alert
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

