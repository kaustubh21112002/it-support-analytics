import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  User,
  Shield,
  Building,
  Mail,
  LogOut,
  Save,
  CheckCircle2
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [items, setItems] = useState(dataService.getNotifications());

  const handleMarkAllRead = () => {
    dataService.markAllNotificationsRead();
    setItems(dataService.getNotifications());
  };

  const handleItemClick = (id: string, link?: string) => {
    dataService.markNotificationRead(id);
    setItems(dataService.getNotifications());
    if (link) navigate(link);
  };

  const displayed = filter === 'unread' ? items.filter((n) => !n.read) : items;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Notifications & System Alerts"
        subtitle="Operational alerts, SLA breach warnings, and ticket lifecycle events."
        breadcrumbs={[{ label: 'Notifications' }]}
        actions={
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        }
      />

      <div className="flex gap-2 border-b border-border text-xs font-semibold pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-lg ${filter === 'all' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          All Notifications ({items.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 rounded-lg ${filter === 'unread' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Unread ({items.filter((n) => !n.read).length})
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-card divide-y divide-border overflow-hidden">
        {displayed.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-secondary">
            No notifications in this view.
          </div>
        ) : (
          displayed.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n.id, n.link)}
              className={`p-4 flex items-start justify-between gap-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                !n.read ? 'bg-indigo-50/20' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg mt-0.5 ${
                  n.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                  n.type === 'alert' ? 'bg-red-100 text-red-700' :
                  n.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-text-primary">{n.title}</h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-brand-600" />
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{n.message}</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 whitespace-nowrap">{n.createdAt}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="User Profile & Settings"
        subtitle="Manage your demo account identity and notification preferences."
        breadcrumbs={[{ label: 'Profile' }]}
      />

      <div className="bg-surface rounded-xl border border-border shadow-card p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
            alt={user?.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-brand-500"
          />
          <div>
            <h2 className="text-lg font-bold text-text-primary">{user?.name}</h2>
            <p className="text-xs text-text-secondary">{user?.title}</p>
            <span className="inline-block mt-1 text-[11px] font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded capitalize border border-brand-200">
              Role: {user?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Corporate Email</label>
            <div className="p-2.5 bg-slate-50 border border-border rounded-lg font-medium text-text-primary">
              {user?.email}
            </div>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Department</label>
            <div className="p-2.5 bg-slate-50 border border-border rounded-lg font-medium text-text-primary">
              {user?.departmentName}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-3">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Notification Preferences
          </h4>
          <label className="flex items-center justify-between text-xs cursor-pointer p-3 rounded-lg hover:bg-slate-50 border border-border">
            <span>Receive automated SLA breach warning emails</span>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={() => setEmailAlerts(!emailAlerts)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
          </label>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-lg text-center font-medium">
            ✓ Preferences saved successfully in current session.
          </div>
        )}
      </div>
    </div>
  );
};
