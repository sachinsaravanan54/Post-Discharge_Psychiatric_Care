import React from 'react';
import { Shield, Lock, EyeOff, Database, Server } from 'lucide-react';

export const PrivacyView: React.FC = () => {
  return (
    <div className="space-y-8 selection:bg-teal-500 selection:text-white pb-12">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20 font-semibold mb-2">
          <Shield className="h-3.5 w-3.5" />
          Privacy-by-Design Compliance
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Privacy & Sensitive Data Architecture</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Documenting privacy-by-design, sensitive psychiatric data minimisation, and security controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm">
            <Database className="h-5 w-5" />
            <span>1. Synthetic Data Guarantee</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            100% of client records, goal descriptions, evidence notes, and session summaries are generated synthetically using randomized parameters. Zero real patient identifiable information (PII) or protected health information (PHI) is collected or stored.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm">
            <EyeOff className="h-5 w-5" />
            <span>2. Minimisation of Sensitive Info</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The platform avoids collecting diagnostic codes (DSM-5 / ICD-11), medication dosage logs, or unstructured clinical free-text notes. Data collection focuses exclusively on functional, goal-oriented recovery metrics (e.g. independent bus travel, sleep routine days).
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm">
            <Lock className="h-5 w-5" />
            <span>3. Role-Based Access Control (RBAC)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Strict authorization policies restrict data access by role. Clients only view their own goals and self-reported evidence. Clinicians view their assigned client roster. Supervisors access anonymized escalation oversight and system metrics.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm">
            <Server className="h-5 w-5" />
            <span>4. Environment Secrets & Zero Logging Leak</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            No hardcoded credentials or JWT secret keys exist in the repository. Secret keys are loaded dynamically via environment variables (`DATABASE_URL`, `SECRET_KEY`). System audit logs capture minimal event metadata without sensitive payload text.
          </p>
        </div>
      </div>
    </div>
  );
};
