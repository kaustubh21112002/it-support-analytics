import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Ticket as TicketIcon,
  PlusCircle,
  Bot,
  BookOpen,
  LayoutDashboard,
  Layers,
  Users2,
  BarChart3,
  TrendingUp,
  Clock,
  ShieldAlert,
  Building2,
  AlertTriangle,
  BrainCircuit,
  FileSpreadsheet,
  Settings,
  Database,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Headphones,
  UploadCloud,
  UserCheck,
  X
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  isMobileDrawer?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onNavigate,
  isMobileDrawer = false
}) => {
  const { user, authMode, isDemoAuth } = useAuth();
  const role = user?.role || 'employee';

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
      isActive
        ? 'bg-brand-50/90 text-brand-700 font-semibold border-l-2 border-brand-600 pl-2.5 shadow-xs'
        : 'text-text-secondary hover:text-text-primary hover:bg-slate-100/70'
    }`;

  return (
    <aside
      className={`bg-surface border-r border-border transition-all duration-300 flex flex-col justify-between select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand header */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-text-primary block leading-none">
                  IT Support <span className="text-brand-600">Analytics</span>
                </span>
                <span className="text-[10px] text-text-secondary tracking-wide uppercase font-semibold">
                  Service Intelligence
                </span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 mx-auto rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
              <Headphones className="w-4 h-4" />
            </div>
          )}

          {isMobileDrawer ? (
            <button
              onClick={onToggleCollapse}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-md text-slate-500 hover:text-text-primary hover:bg-slate-100 transition-colors border border-transparent hover:border-border"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="p-1.5 rounded-md text-slate-400 hover:text-text-primary hover:bg-slate-100 hidden md:flex transition-colors border border-transparent hover:border-border"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation list */}
        <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          {/* Employee Self-Service */}
          {(role === 'employee' || role === 'admin' || role === 'manager') && (
            <div>
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Employee Self-Service
                </p>
              )}
              <nav className="space-y-0.5">
                <NavLink to="/portal" end onClick={onNavigate} className={navItemClass} title="Employee Portal">
                  <Home className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>Portal Home</span>}
                </NavLink>
                <NavLink to="/portal/tickets" onClick={onNavigate} className={navItemClass} title="My Tickets">
                  <TicketIcon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>My Tickets</span>}
                </NavLink>
                <NavLink to="/portal/tickets/new" onClick={onNavigate} className={navItemClass} title="Create Ticket">
                  <PlusCircle className="w-4 h-4 flex-shrink-0 text-brand-600" />
                  {!collapsed && <span>Create Ticket</span>}
                </NavLink>
                <NavLink to="/portal/assistant" onClick={onNavigate} className={navItemClass} title="AI Assistant">
                  <Bot className="w-4 h-4 flex-shrink-0 text-indigo-500" />
                  {!collapsed && <span>AI Support Assistant</span>}
                </NavLink>
                <NavLink to="/portal/knowledge" onClick={onNavigate} className={navItemClass} title="Knowledge Base">
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>Knowledge Base</span>}
                </NavLink>
              </nav>
            </div>
          )}

          {/* Support Agent Workspace */}
          {(role === 'agent' || role === 'admin' || role === 'manager') && (
            <div>
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Agent Workspace
                </p>
              )}
              <nav className="space-y-0.5">
                <NavLink to="/agent" end onClick={onNavigate} className={navItemClass} title="Agent Dashboard">
                  <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>Agent Dashboard</span>}
                </NavLink>
                <NavLink to="/agent/tickets" onClick={onNavigate} className={navItemClass} title="Ticket Queue">
                  <Layers className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>Ticket Queue</span>}
                </NavLink>
                <NavLink to="/agent/workload" onClick={onNavigate} className={navItemClass} title="Team Workload">
                  <Users2 className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>Team Workload</span>}
                </NavLink>
              </nav>
            </div>
          )}

          {/* Management Analytics */}
          {(role === 'manager' || role === 'admin') && (
            <div>
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Service Intelligence
                </p>
              )}
              <nav className="space-y-0.5">
                <NavLink to="/analytics/overview" onClick={onNavigate} className={navItemClass} title="Executive Dashboard">
                  <BarChart3 className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>Executive Dashboard</span>}
                </NavLink>
                <NavLink to="/analytics/trends" onClick={onNavigate} className={navItemClass} title="Ticket Trends">
                  <TrendingUp className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>Ticket Trends</span>}
                </NavLink>
                <NavLink to="/analytics/resolution" onClick={onNavigate} className={navItemClass} title="Resolution Time">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>Resolution Time</span>}
                </NavLink>
                <NavLink to="/analytics/sla" onClick={onNavigate} className={navItemClass} title="SLA Command Center">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-500" />
                  {!collapsed && <span>SLA Command Center</span>}
                </NavLink>
                <NavLink to="/analytics/teams" onClick={onNavigate} className={navItemClass} title="Team Performance">
                  <Users2 className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>Team Performance</span>}
                </NavLink>
                <NavLink to="/analytics/departments" onClick={onNavigate} className={navItemClass} title="Department Demand">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>Departments</span>}
                </NavLink>
                <NavLink to="/analytics/issues" onClick={onNavigate} className={navItemClass} title="Recurring Issues">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>Recurring Issues</span>}
                </NavLink>
                <NavLink to="/analytics/predictions" onClick={onNavigate} className={navItemClass} title="ML Predictions">
                  <BrainCircuit className="w-4 h-4 flex-shrink-0 text-indigo-500" />
                  {!collapsed && <span>ML Predictions</span>}
                </NavLink>
                <NavLink to="/analytics/reports" onClick={onNavigate} className={navItemClass} title="Reports & Export">
                  <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>Reports & Export</span>}
                </NavLink>
              </nav>
            </div>
          )}

          {/* Administration */}
          {(role === 'admin' || role === 'manager') && (
            <div>
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Administration & Data
                </p>
              )}
              <nav className="space-y-0.5">
                <NavLink to="/admin" end onClick={onNavigate} className={navItemClass} title="Admin Overview">
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>Admin Overview</span>}
                </NavLink>
                <NavLink to="/admin/data" onClick={onNavigate} className={navItemClass} title="Data Workbench & QA">
                  <Database className="w-4 h-4 flex-shrink-0 text-brand-600" />
                  {!collapsed && <span>Data Workbench</span>}
                </NavLink>
                {role === 'admin' && (
                  <>
                    <NavLink to="/admin/upload" onClick={onNavigate} className={navItemClass} title="Dataset Ingestion & Upload">
                      <UploadCloud className="w-4 h-4 flex-shrink-0 text-sky-500" />
                      {!collapsed && <span>Data Ingestion</span>}
                    </NavLink>
                    <NavLink to="/admin/sla" onClick={onNavigate} className={navItemClass} title="SLA Configuration">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>SLA Policy Rules</span>}
                    </NavLink>
                    <NavLink to="/admin/users" onClick={onNavigate} className={navItemClass} title="Users & Roles">
                      <Users2 className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>User Management</span>}
                    </NavLink>
                    <NavLink to="/admin/access-requests" onClick={onNavigate} className={navItemClass} title="Access Requests Queue">
                      <UserCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                      {!collapsed && <span>Access Requests</span>}
                    </NavLink>
                    <NavLink to="/admin/security" onClick={onNavigate} className={navItemClass} title="Security Settings">
                      <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>Security & MFA</span>}
                    </NavLink>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Role indicator and user profile in sidebar footer */}
      {!collapsed && (
        <div className="p-3 border-t border-border bg-surface-subtle m-2 rounded-xl border border-border-subtle shadow-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
              alt={user?.name || 'User'}
              className="w-7 h-7 rounded-full object-cover border border-border flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-text-primary truncate leading-tight">{user?.name || 'Unauthenticated'}</p>
              <p className="text-[10px] text-text-secondary truncate leading-tight">{user?.title || 'User'}</p>
            </div>
          </div>
          <div className="pt-2 border-t border-border-subtle space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Role</span>
              <span className="font-bold text-brand-700 capitalize bg-brand-50 px-2 py-0.5 rounded text-[10px] border border-brand-200">
                {role}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Mode</span>
              <span
                className={`font-semibold px-1.5 py-0.5 rounded text-[9px] border ${
                  authMode === 'supabase'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : isDemoAuth
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {authMode === 'supabase'
                  ? 'Verified Supabase'
                  : isDemoAuth
                  ? 'Demo Persona'
                  : 'Unauthenticated'}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

