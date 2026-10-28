import React, { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../services/api';
import { FollowUpAction, EscalationEvent } from '../types';
import {
  ShieldAlert, RefreshCw, CheckCircle2, Clock,
  Calendar, Trash2, Plus, X, AlertCircle
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export const EscalationsView: React.FC = () => {
  const { role } = useAuth();
  const [actions, setActions] = useState<FollowUpAction[]>([]);
  const [escalationEvents, setEscalationEvents] = useState<EscalationEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'ACTIONS' | 'EVENTS'>('EVENTS');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create Action Modal State
  const [showCreateActionModal, setShowCreateActionModal] = useState(false);
  const [goalId, setGoalId] = useState<string>('1');
  const [actionDesc, setActionDesc] = useState('');
  const [ownerRole, setOwnerRole] = useState('Care Coordinator');
  const [ownerId, setOwnerId] = useState('CLIN-101');
  const [priority, setPriority] = useState('High');
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [actionsRes, eventsRes] = await Promise.all([
        api.get('/actions'),
        api.get('/actions/escalations/events')
      ]);
      setActions(actionsRes.data);
      setEscalationEvents(eventsRes.data);
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScanEscalations = async () => {
    try {
      setScanning(true);
      setErrorMsg(null);
      const res = await api.post('/actions/scan-escalations');
      const sweep = res.data.sweep_results;
      setSuccessMsg(
        `Escalation scan completed! ${sweep.total_new_escalations} new event(s) triggered ` +
        `(${sweep.overdue_actions_escalated} overdue actions, ${sweep.missed_checkins_escalated} missed check-ins, ` +
        `${sweep.approaching_deadlines_escalated} approaching deadlines, ${sweep.repeated_barriers_escalated} repeated barriers, ` +
        `${sweep.deteriorations_escalated} deteriorations, ${sweep.rating_discrepancies_escalated} rating disagreements).`
      );
      fetchData();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    } finally {
      setScanning(false);
    }
  };

  const handleResolveEvent = async (eventId: number) => {
    const notes = prompt('Enter resolution notes for this escalation:', 'Resolved through collaborative team review and plan adjustment');
    if (!notes) return;
    try {
      await api.patch(`/actions/escalations/events/${eventId}/resolve`, { resolution_notes: notes });
      setSuccessMsg(`Escalation Event #${eventId} marked as Resolved.`);
      fetchData();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    }
  };

  const handleMarkComplete = async (actionId: number) => {
    try {
      await api.patch(`/actions/${actionId}`, { status: 'Completed' });
      setSuccessMsg(`Action #${actionId} marked as completed.`);
      fetchData();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    }
  };

  const handleDeleteAction = async (actionId: number) => {
    if (!window.confirm(`Delete follow-up action #${actionId}?`)) return;
    try {
      await api.delete(`/actions/${actionId}`);
      setSuccessMsg(`Action #${actionId} removed.`);
      fetchData();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    }
  };

  const handleManualEscalate = async (actionId: number) => {
    const reason = prompt('Enter escalation reason for supervisor review:', 'Urgent client follow-up required');
    if (!reason) return;
    try {
      await api.post(`/actions/${actionId}/escalate`, { escalation_reason: reason });
      setSuccessMsg(`Action #${actionId} escalated.`);
      fetchData();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    }
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/actions', {
        goal_id: Number(goalId),
        description: actionDesc,
        owner_role: ownerRole,
        owner_id: ownerId,
        priority: priority,
        due_date: new Date(dueDate).toISOString()
      });
      setShowCreateActionModal(false);
      setActionDesc('');
      setSuccessMsg('New follow-up action created and added to queue.');
      fetchData();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    }
  };

  const filteredEvents = escalationEvents.filter((ev) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'OPEN') return ev.status !== 'Resolved';
    if (filterType === 'RESOLVED') return ev.status === 'Resolved';
    return ev.rule_type === filterType;
  });

  const filteredActions = actions.filter((a) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'HIGH') return a.priority === 'High';
    if (filterType === 'OVERDUE') return a.status === 'Overdue';
    if (filterType === 'ESCALATED') return a.escalated;
    return true;
  });

  const getRuleBadge = (ruleType: string) => {
    switch (ruleType) {
      case 'MISSED_CHECKIN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Missed Check-in</span>;
      case 'OVERDUE_ACTION':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Overdue Action</span>;
      case 'APPROACHING_DEADLINE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Approaching Deadline</span>;
      case 'REPEATED_BARRIERS':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">Repeated Barriers</span>;
      case 'GOAL_DETERIORATION':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600/20 text-red-400 border border-red-500/30">Measurement Deterioration</span>;
      case 'RATING_DISAGREEMENT':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Rating Disagreement</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">{ruleType}</span>;
    }
  };

  return (
    <div className="space-y-6 selection:bg-teal-500 selection:text-white pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 text-rose-400 text-xs rounded-full border border-rose-500/20 font-semibold mb-2">
            <ShieldAlert className="h-3.5 w-3.5" />
            Automated Escalation Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Escalation Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Multi-rule backend escalation engine tracking missed check-ins, overdue actions, repeated barriers, and rapid deterioration.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleScanEscalations}
            disabled={scanning}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Running Rules...' : 'Run Escalation Engine Scan'}</span>
          </button>

          {role !== 'CLIENT' && (
            <button
              onClick={() => setShowCreateActionModal(true)}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-teal-600/30"
            >
              <Plus className="h-4 w-4" />
              <span>Create Action</span>
            </button>
          )}
        </div>
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
            <AlertCircle className="h-4 w-4" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab('EVENTS'); setFilterType('ALL'); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'EVENTS'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            System Escalation Events ({escalationEvents.length})
          </button>
          <button
            onClick={() => { setActiveTab('ACTIONS'); setFilterType('ALL'); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ACTIONS'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Follow-Up Action Queue ({actions.length})
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {activeTab === 'EVENTS' ? (
            <>
              {['ALL', 'OPEN', 'RESOLVED', 'OVERDUE_ACTION', 'MISSED_CHECKIN', 'GOAL_DETERIORATION', 'REPEATED_BARRIERS'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterType === f
                      ? 'bg-slate-700 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </>
          ) : (
            <>
              {['ALL', 'HIGH', 'OVERDUE', 'ESCALATED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterType === f
                      ? 'bg-slate-700 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-slate-400 rounded-2xl space-y-3">
          <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div>Evaluating escalation engine rules and queue...</div>
        </div>
      ) : activeTab === 'EVENTS' ? (
        filteredEvents.length === 0 ? (
          <div className="glass-panel p-12 text-center text-xs text-slate-400 rounded-2xl space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/80 mx-auto" />
            <div className="font-semibold text-slate-300">No matching escalation events</div>
            <p className="text-slate-500">All care rules are currently within safety thresholds.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className={`glass-panel p-5 rounded-2xl border transition-all ${
                  ev.status === 'Resolved'
                    ? 'border-slate-800 opacity-75'
                    : 'border-rose-500/40 bg-rose-950/15'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getRuleBadge(ev.rule_type)}

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ev.status === 'Resolved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500 text-white animate-pulse'
                      }`}>
                        {ev.status}
                      </span>

                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Triggered: {new Date(ev.created_at).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {ev.trigger_reason}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-400 pt-1">
                      <div>
                        Assigned Owner: <strong className="text-slate-200">{ev.assigned_owner}</strong>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>Resolution Deadline: </span>
                        <strong className="text-rose-300 font-mono">
                          {new Date(ev.target_resolution_deadline).toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {ev.audit_notes && (
                      <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-slate-300 text-xs font-mono">
                        <strong>Audit Trail:</strong> {ev.audit_notes}
                        {ev.resolved_at && (
                          <span className="text-emerald-400 ml-2">
                            (Resolved on {new Date(ev.resolved_at).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {ev.status !== 'Resolved' && role !== 'CLIENT' && (
                    <button
                      onClick={() => handleResolveEvent(ev.id)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/30 whitespace-nowrap self-start"
                    >
                      Resolve Escalation
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Action Queue Tab */
        filteredActions.length === 0 ? (
          <div className="glass-panel p-12 text-center text-xs text-slate-400 rounded-2xl space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/80 mx-auto" />
            <div className="font-semibold text-slate-300">No actions match filter</div>
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
                        Escalate
                      </button>
                    )}

                    {role !== 'CLIENT' && (
                      <button
                        onClick={() => handleDeleteAction(action.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                        title="Delete Action"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Create Action Modal */}
      {showCreateActionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Care Follow-Up Action</h3>
              <button onClick={() => setShowCreateActionModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAction} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Goal ID</label>
                <input
                  type="number"
                  required
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Action Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Schedule peer accompaniment for transit rehearsal"
                  value={actionDesc}
                  onChange={(e) => setActionDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
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
                    <option value="Primary Clinician">Primary Clinician</option>
                    <option value="Peer Support Specialist">Peer Support Specialist</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Owner ID</label>
                  <input
                    type="text"
                    required
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
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
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-teal-600/30"
              >
                Create Follow-Up Action
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

