import React, { useState, useEffect } from 'react';
import { dataService, useDataService, DEMO_USERS } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import { KpiCard } from '../../components/common/KpiCard';
import { UserRole, SlaRule, TicketPriority } from '../../types';
import { AdminUploadPage } from './AdminUploadPage';
export { AdminUploadPage };
import {
  Settings,
  Database,
  Users2,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit2,
  Save,
  RotateCcw,
  Upload,
  Info,
  Key
} from 'lucide-react';

// 1. AdminOverview
export const AdminOverview: React.FC = () => {
  useDataService();
  const users = dataService.getUsers();
  const audits = dataService.getAuditEvents();
  const workbenchStats = dataService.getDataWorkbenchStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration & Data Governance"
        subtitle="Manage seeded users, configure SLA threshold policies, and inspect dataset integrity."
        breadcrumbs={[
          { label: 'Administration', path: '/admin' },
          { label: 'Overview' }
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Demo Personas"
          value={users.length}
          subtitle="Governed RBAC profiles"
          icon={Users2}
          variant="brand"
        />
        <KpiCard
          title="Clean Reference Tickets"
          value={workbenchStats.totalCleanRows.toLocaleString()}
          subtitle="Zero integrity defects"
          icon={Database}
          variant="healthy"
        />
        <KpiCard
          title="Raw Injected Defects"
          value="120"
          subtitle="Across dirty QA test variant"
          icon={AlertTriangle}
          variant="warning"
        />
        <KpiCard
          title="System Audit State"
          value="Compliant"
          subtitle="All operations logged"
          icon={ShieldCheck}
          variant="healthy"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Governance Audit Log */}
        <div className="bg-surface rounded-xl border border-border shadow-card p-5">
          <h3 className="font-bold text-sm text-text-primary mb-3">Recent Governance Audit Log</h3>
          <div className="space-y-3">
            {audits.slice(0, 5).map((a) => (
              <div key={a.id} className="p-3 rounded-lg border border-border bg-slate-50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-600">{a.action}</span>
                  <span className="text-[10px] text-slate-400">{a.timestamp}</span>
                </div>
                <p className="text-text-primary">{a.details}</p>
                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                  <span>Actor: {a.user}</span>
                  <span className="text-emerald-700 font-semibold">{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dataset Architecture Summary */}
        <div className="bg-surface rounded-xl border border-border shadow-card p-5 space-y-4">
          <h3 className="font-bold text-sm text-text-primary">Dataset Schema Architecture</h3>
          <p className="text-xs text-text-secondary">
            Relational snowflake design with 1 fact table and 5 supporting dimension tables.
          </p>
          <div className="divide-y divide-border text-xs">
            {workbenchStats.tables.map((t) => (
              <div key={t.name} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-text-primary">{t.name}</span>
                  <span className="text-[11px] text-slate-400 block">PK: {t.pk} • {t.fks} FKs</span>
                </div>
                <span className="font-bold text-slate-700">{t.cleanRows.toLocaleString()} rows</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. UserManagementPage
export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState(dataService.getUsers());
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('employee');

  const handleSaveRole = (userId: string) => {
    dataService.updateUser(userId, { role: selectedRole });
    setUsers(dataService.getUsers());
    setEditingUserId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Role Management"
        subtitle="Manage simulated corporate accounts and evaluate client-side role-based access rules."
        breadcrumbs={[
          { label: 'Administration', path: '/admin' },
          { label: 'Users & Roles' }
        ]}
      />

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold">Security Transparency: </span>
          <span>
            These permissions are simulated on the frontend for prototype demonstration. In a production enterprise deployment, authorization must be validated server-side by an identity provider (e.g. Okta / Azure AD).
          </span>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-slate-500 font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-text-primary flex items-center gap-2">
                    <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                    <span>{u.name}</span>
                  </td>
                  <td className="py-3 px-4 text-text-secondary">{u.email}</td>
                  <td className="py-3 px-4 text-text-primary">{u.departmentName}</td>
                  <td className="py-3 px-4">
                    {editingUserId === u.id ? (
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                        className="px-2 py-1 border border-brand-300 rounded text-xs bg-white font-medium"
                      >
                        <option value="employee">Employee</option>
                        <option value="agent">Support Agent</option>
                        <option value="manager">Manager / Analyst</option>
                        <option value="admin">Administrator</option>
                      </select>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-brand-50 text-brand-700 border border-brand-200">
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingUserId === u.id ? (
                      <button
                        onClick={() => handleSaveRole(u.id)}
                        className="px-2.5 py-1 bg-brand-600 text-white rounded text-xs font-semibold"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingUserId(u.id);
                          setSelectedRole(u.role);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-text-primary hover:bg-slate-100"
                        title="Edit Role"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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

// 3. SlaConfigPage
export const SlaConfigPage: React.FC = () => {
  const version = useDataService();
  const [slaRules, setSlaRules] = useState(dataService.getSlaRules());
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editHours, setEditHours] = useState<number>(24);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setSlaRules(dataService.getSlaRules());
  }, [version]);

  const handleSave = (ruleId: number) => {
    dataService.updateSlaRule(ruleId, editHours);
    setSlaRules(dataService.getSlaRules());
    setEditingRuleId(null);
    setSuccessMsg('SLA Rule updated successfully. Recalculated demo analytics views.');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA Policy Configuration"
        subtitle="Manage target resolution thresholds by priority band. Adjustments reflect across demo compliance views."
        breadcrumbs={[
          { label: 'Administration', path: '/admin' },
          { label: 'SLA Policy Rules' }
        ]}
      />

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
          ✓ {successMsg}
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-border text-slate-500 font-semibold">
              <th className="py-3 px-4">Priority Tier</th>
              <th className="py-3 px-4">Target Resolution Window</th>
              <th className="py-3 px-4">Calculation Base</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {slaRules.map((r) => (
              <tr key={r.sla_rule_id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-bold text-text-primary">{r.priority}</td>
                <td className="py-3 px-4 font-semibold text-brand-600">
                  {editingRuleId === r.sla_rule_id ? (
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="168"
                      value={editHours}
                      onChange={(e) => setEditHours(Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-brand-300 rounded text-xs font-bold"
                    />
                  ) : (
                    `${r.target_resolution_hours} Calendar Hours`
                  )}
                </td>
                <td className="py-3 px-4 text-text-secondary">24/7 Calendar Clock</td>
                <td className="py-3 px-4 text-slate-500">{r.description || `Target for ${r.priority} requests`}</td>
                <td className="py-3 px-4 text-right">
                  {editingRuleId === r.sla_rule_id ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleSave(r.sla_rule_id)}
                        className="px-2.5 py-1 bg-brand-600 text-white rounded text-xs font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingRuleId(null)}
                        className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingRuleId(r.sla_rule_id);
                        setEditHours(r.target_resolution_hours);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-text-primary hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 4. DataWorkbenchPage
export const DataWorkbenchPage: React.FC = () => {
  useDataService();
  const stats = dataService.getDataWorkbenchStats();
  const [tab, setTab] = useState<'qa' | 'dictionary' | 'import'>('qa');

  const dataDictionary = [
    { col: 'ticket_id', type: 'VARCHAR(20)', null: 'NO', desc: 'Primary key (e.g. TKT-00042)' },
    { col: 'created_at', type: 'DATETIME', null: 'NO', desc: 'Ticket submission timestamp' },
    { col: 'resolved_at', type: 'DATETIME', null: 'YES', desc: 'Resolution timestamp (NULL if open)' },
    { col: 'status', type: 'ENUM', null: 'NO', desc: 'Open, In Progress, Pending, Resolved, Closed' },
    { col: 'priority', type: 'ENUM', null: 'NO', desc: 'Critical, High, Medium, Low' },
    { col: 'category_id', type: 'INT', null: 'NO', desc: 'FK referencing categories table' },
    { col: 'issue_type', type: 'VARCHAR(150)', null: 'NO', desc: 'Specific incident or request type' },
    { col: 'department_id', type: 'INT', null: 'NO', desc: 'FK referencing departments table' },
    { col: 'team_id', type: 'INT', null: 'NO', desc: 'FK referencing teams table' },
    { col: 'agent_id', type: 'INT', null: 'YES', desc: 'FK referencing agents table (NULL if unassigned)' },
    { col: 'sla_rule_id', type: 'INT', null: 'NO', desc: 'FK referencing sla_rules table' },
    { col: 'satisfaction_rating', type: 'TINYINT', null: 'YES', desc: 'Requester CSAT score (1 to 5)' },
    { col: 'resolution_time_hours', type: 'DECIMAL(8,2)', null: 'YES', desc: 'Derived duration in decimal calendar hours' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Quality & Governance Workbench"
        subtitle="Compare clean reference data against raw/dirty test data, inspect data dictionaries, and test pipeline integrity."
        breadcrumbs={[
          { label: 'Administration', path: '/admin' },
          { label: 'Data Workbench' }
        ]}
      />

      <div className="flex items-center gap-3 border-b border-border text-xs font-semibold">
        <button
          onClick={() => setTab('qa')}
          className={`pb-2.5 px-1 ${tab === 'qa' ? 'border-b-2 border-brand-600 text-brand-600 font-bold' : 'text-text-secondary'}`}
        >
          QA & Integrity Audit Checks
        </button>
        <button
          onClick={() => setTab('dictionary')}
          className={`pb-2.5 px-1 ${tab === 'dictionary' ? 'border-b-2 border-brand-600 text-brand-600 font-bold' : 'text-text-secondary'}`}
        >
          Data Dictionary
        </button>
        <button
          onClick={() => setTab('import')}
          className={`pb-2.5 px-1 ${tab === 'import' ? 'border-b-2 border-brand-600 text-brand-600 font-bold' : 'text-text-secondary'}`}
        >
          Simulated Data Ingestion
        </button>
      </div>

      {tab === 'qa' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title="Clean Reference Tickets"
              value={stats.totalCleanRows.toLocaleString()}
              subtitle="100% relational integrity"
              icon={CheckCircle2}
              variant="healthy"
            />
            <KpiCard
              title="Raw / Dirty Variant Rows"
              value={stats.totalDirtyRows.toLocaleString()}
              subtitle="120 injected test defects"
              icon={AlertTriangle}
              variant="warning"
            />
            <KpiCard
              title="Data Integrity Score"
              value="100.0%"
              subtitle="Clean analytical partition"
              icon={ShieldCheck}
              variant="healthy"
            />
          </div>

          <div className="bg-surface rounded-xl border border-border shadow-card p-5">
            <h3 className="font-bold text-sm text-text-primary mb-3">
              Automated Pipeline Integrity Audit: Clean vs. Dirty Variant
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">Data Integrity Check</th>
                    <th className="py-2.5 px-3">Clean Reference Dataset</th>
                    <th className="py-2.5 px-3">Raw / Dirty Variant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.checks.map((chk, i) => (
                    <tr key={i} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-semibold text-text-primary">{chk.check}</td>
                      <td className="py-3 px-3 text-emerald-700 font-medium">✓ {chk.cleanStatus}</td>
                      <td className="py-3 px-3 text-red-600 font-medium">✗ {chk.dirtyStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'dictionary' && (
        <div className="bg-surface rounded-xl border border-border shadow-card p-5">
          <h3 className="font-bold text-sm text-text-primary mb-3">Core Fact Table: `tickets`</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Column Name</th>
                  <th className="py-2.5 px-3">Data Type</th>
                  <th className="py-2.5 px-3">Nullable</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dataDictionary.map((col, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-bold text-brand-600">{col.col}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{col.type}</td>
                    <td className="py-2.5 px-3 font-semibold">{col.null}</td>
                    <td className="py-2.5 px-3 text-text-secondary">{col.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'import' && (
        <AdminUploadPage />
      )}
    </div>
  );
};

// 5. SecuritySettingsPage
export const SecuritySettingsPage: React.FC = () => {
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('60');

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Security & Governance Settings"
        subtitle="Manage authentication controls, token policies, and access audit settings."
        breadcrumbs={[
          { label: 'Administration', path: '/admin' },
          { label: 'Security' }
        ]}
      />

      <div className="bg-surface rounded-xl border border-border shadow-card p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h4 className="font-bold text-sm text-text-primary">Two-Factor Authentication (MFA)</h4>
            <p className="text-xs text-text-secondary">
              Require 6-digit OTP verification on all employee and administrative logins.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={mfaEnforced}
              onChange={() => setMfaEnforced(!mfaEnforced)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h4 className="font-bold text-sm text-text-primary">Session Inactivity Timeout</h4>
            <p className="text-xs text-text-secondary">
              Automatically lock dormant analytical sessions to preserve governance integrity.
            </p>
          </div>
          <select
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium"
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
            <option value="120">2 hours</option>
          </select>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-border text-xs text-slate-600">
          <strong>Environment Disclosure:</strong> These controls represent prototype security settings. Production systems integrate with corporate SAML 2.0 / OIDC identity providers.
        </div>
      </div>
    </div>
  );
};
