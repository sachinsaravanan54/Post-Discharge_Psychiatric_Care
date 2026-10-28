import React, { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../services/api';
import { Client } from '../types';
import { useAuth } from '../context/AuthContext';
import { Users, Search, ChevronRight, Plus, Trash2, Edit3, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ClientsList: React.FC = () => {
  const { role } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Client | null>(null);

  // Form states
  const [syntheticId, setSyntheticId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/clients');
      setClients(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.post('/clients', {
        synthetic_client_id: syntheticId.trim(),
        display_name_or_alias: displayName.trim(),
        active: isActive,
      });
      setSuccessMsg(`Successfully registered new participant: ${displayName}`);
      setShowCreateModal(false);
      setSyntheticId('');
      setDisplayName('');
      fetchClients();
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.patch(`/clients/${showEditModal.id}`, {
        display_name_or_alias: displayName.trim(),
        active: isActive,
      });
      setSuccessMsg(`Client ${displayName} updated successfully.`);
      setShowEditModal(null);
      fetchClients();
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (clientId: number, clientName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove client '${clientName}'? This action cannot be undone.`)) {
      return;
    }
    setError(null);
    setSuccessMsg(null);
    try {
      await api.delete(`/clients/${clientId}`);
      setSuccessMsg(`Client '${clientName}' was successfully deleted.`);
      fetchClients();
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    }
  };

  const openEditModal = (client: Client, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEditModal(client);
    setDisplayName(client.display_name_or_alias);
    setIsActive(client.active);
  };

  const filteredClients = clients.filter(
    (c) =>
      c.synthetic_client_id.toLowerCase().includes(search.toLowerCase()) ||
      c.display_name_or_alias.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 selection:bg-teal-500 selection:text-white pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="h-7 w-7 text-teal-400" />
            <span>Client Roster</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Collaborative goal-based outcome tracking for discharge participants.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by alias or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          {role !== 'CLIENT' && (
            <button
              onClick={() => {
                setSyntheticId(`CL-${String(clients.length + 1).padStart(4, '0')}`);
                setDisplayName('');
                setIsActive(true);
                setShowCreateModal(true);
              }}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-teal-600/30 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Add Client</span>
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

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Content states */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-slate-400 rounded-2xl space-y-3">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div>Loading client dataset from FastAPI...</div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-slate-400 rounded-2xl space-y-3">
          <Users className="h-8 w-8 text-slate-600 mx-auto" />
          <div className="font-semibold text-slate-300">No matching clients found</div>
          <p className="text-slate-500">
            {search ? 'Try clearing your search filter.' : 'Get started by creating your first client record.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              to={`/clients/${client.id}`}
              className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-teal-500/40 transition-all block group relative"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-teal-400 font-mono">
                    {client.synthetic_client_id}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors mt-0.5">
                    {client.display_name_or_alias}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      client.active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {client.active ? 'Active Care' : 'Inactive'}
                  </span>
                  {role !== 'CLIENT' && (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        title="Edit Client"
                        onClick={(e) => openEditModal(client, e)}
                        className="p-1 text-slate-400 hover:text-teal-400 rounded transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Delete Client"
                        onClick={(e) => handleDeleteClient(client.id, client.display_name_or_alias, e)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Created: {new Date(client.created_at).toLocaleDateString()}</span>
                <span className="text-teal-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  <span>View Goals</span>
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add New Participant</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Synthetic Client ID</label>
                <input
                  type="text"
                  required
                  value={syntheticId}
                  onChange={(e) => setSyntheticId(e.target.value)}
                  placeholder="e.g. CL-0101"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Display Name or Alias</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Participant Alpha"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeClientCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0"
                />
                <label htmlFor="activeClientCheck" className="font-semibold text-slate-300">
                  Mark participant as active in post-discharge program
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-teal-600/30 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Participant Record'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit Client: {showEditModal.synthetic_client_id}</h3>
              <button onClick={() => setShowEditModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditClient} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Display Name or Alias</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0"
                />
                <label htmlFor="editActiveCheck" className="font-semibold text-slate-300">
                  Active in care program
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-teal-600/30 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

