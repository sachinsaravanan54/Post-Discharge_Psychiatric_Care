import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Client } from '../types';
import { Users, Search, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ClientsList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const res = await api.get('/clients');
        setClients(res.data);
      } catch (err) {
        console.error('Error fetching clients', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter(
    (c) =>
      c.synthetic_client_id.toLowerCase().includes(search.toLowerCase()) ||
      c.display_name_or_alias.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 selection:bg-teal-500 selection:text-white pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="h-7 w-7 text-teal-400" />
            <span>Client Roster</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Synthetic clients with collaborative goal-based outcome tracking.
          </p>
        </div>

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
      </div>

      {loading ? (
        <div className="glass-panel p-8 text-center text-xs text-slate-400 rounded-2xl">
          Loading client dataset...
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="glass-panel p-8 text-center text-xs text-slate-400 rounded-2xl">
          No matching clients found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              to={`/clients/${client.id}`}
              className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-teal-500/40 transition-all block group"
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
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-semibold">
                  Active Care
                </span>
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
    </div>
  );
};
