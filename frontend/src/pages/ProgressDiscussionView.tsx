import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Client, Goal } from '../types';
import { CheckSquare, AlertTriangle, User, Send, CheckCircle2 } from 'lucide-react';

export const ProgressDiscussionView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);

  // Form Fields
  const [measuredResult, setMeasuredResult] = useState<string>('3.0');
  const [evidenceNote, setEvidenceNote] = useState('Travelled on Route 4 bus with peer worker escort on Tuesday.');
  const [confidence, setConfidence] = useState<number>(8);
  const [barrierDesc, setBarrierDesc] = useState('');
  const [proposedAdj, setProposedAdj] = useState('');

  // Follow up action
  const [actionDesc, setActionDesc] = useState('Care coordinator to review bus schedule with client before next journey');
  const [ownerRole, setOwnerRole] = useState('Care Coordinator');
  const [ownerId, setOwnerId] = useState('CLIN-101');
  const [priority, setPriority] = useState('High');
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get('/clients');
        setClients(res.data);
        if (res.data.length > 0) {
          setSelectedClientId(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    if (!selectedClientId) return;
    const fetchGoals = async () => {
      try {
        const res = await api.get(`/goals?client_id=${selectedClientId}`);
        setGoals(res.data);
        if (res.data.length > 0) {
          setSelectedGoalId(res.data[0].id);
        } else {
          setSelectedGoalId(null);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchGoals();
  }, [selectedClientId]);

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  const handleSubmitDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId) return;
    setLoading(true);
    setError(null);
    setSummaryResult(null);

    try {
      const res = await api.post('/goals/progress-discussion', {
        goal_id: selectedGoalId,
        measured_result: parseFloat(measuredResult),
        evidence_note: evidenceNote,
        client_confidence: Number(confidence),
        barrier_description: barrierDesc || null,
        proposed_adjustment: proposedAdj || null,
        action_description: actionDesc,
        action_owner_role: ownerRole,
        action_owner_id: ownerId,
        action_priority: priority,
        action_due_date: new Date(dueDate).toISOString()
      });

      setSummaryResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit discussion workflow.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 selection:bg-teal-500 selection:text-white pb-12">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 text-teal-400 text-xs rounded-full border border-teal-500/20 font-semibold mb-2">
          <CheckSquare className="h-3.5 w-3.5" />
          Collaborative Outcome Review
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Progress Discussion View</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Clinicians and clients collaboratively evaluate measured results, record evidence, address barriers, and create high-priority follow-up actions.
        </p>
      </div>

      {summaryResult && (
        <div className="glass-panel p-6 rounded-2xl border border-teal-500/40 bg-teal-950/20 space-y-3">
          <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm">
            <CheckCircle2 className="h-5 w-5" />
            <span>Discussion Workflow Successfully Recorded!</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            {summaryResult.summary_text}
          </p>
          <div className="text-xs font-semibold text-teal-300">
            Calculated Goal Progress Attainment: {summaryResult.progress_percentage}%
          </div>
          {summaryResult.escalation_warning && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs">
              {summaryResult.escalation_warning}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmitDiscussion} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Select Client & Goal */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-teal-400" />
            <span>1. Select Client & Goal Target</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Select Client</label>
              <select
                value={selectedClientId || ''}
                onChange={(e) => setSelectedClientId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.synthetic_client_id} — {c.display_name_or_alias}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Select Goal</label>
              <select
                value={selectedGoalId || ''}
                onChange={(e) => setSelectedGoalId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
              >
                {goals.length === 0 ? (
                  <option value="">No goals found for this client</option>
                ) : (
                  goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      [{g.goal_category}] {g.goal_text}
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedGoal && (
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 mt-2">
                <div className="text-[11px] font-bold text-teal-400 uppercase">Target Details</div>
                <div className="text-sm font-bold text-white">{selectedGoal.goal_text}</div>
                <div className="flex justify-between text-xs text-slate-400 pt-1">
                  <span>Baseline: <strong>{selectedGoal.baseline_value} {selectedGoal.unit}</strong></span>
                  <span>Target: <strong>{selectedGoal.target_value} {selectedGoal.unit}</strong></span>
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Measured Result</label>
              <input
                type="number"
                step="any"
                value={measuredResult}
                onChange={(e) => setMeasuredResult(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Self-Reported Confidence (1-10)</label>
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
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Barriers, Adjustments & Follow-Up Action */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>2. Barriers, Adjustments & Follow-Up Action</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Identified Barrier (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Anxiety during peak route hours"
                  value={barrierDesc}
                  onChange={(e) => setBarrierDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Agreed Adjustment (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule peer walk-along escort"
                  value={proposedAdj}
                  onChange={(e) => setProposedAdj(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">Follow-Up Action Required</div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Action Description</label>
                  <input
                    type="text"
                    value={actionDesc}
                    onChange={(e) => setActionDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Owner Role</label>
                    <select
                      value={ownerRole}
                      onChange={(e) => setOwnerRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="Care Coordinator">Care Coordinator</option>
                      <option value="Peer Support Worker">Peer Support Worker</option>
                      <option value="Client">Client</option>
                      <option value="Supervisor">Supervisor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Owner ID (Required)</label>
                    <input
                      type="text"
                      value={ownerId}
                      onChange={(e) => setOwnerId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedGoalId}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            <Send className="h-4 w-4" />
            <span>{loading ? 'Processing Workflow...' : 'Record Discussion & Trigger Workflow'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
