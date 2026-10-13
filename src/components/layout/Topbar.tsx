import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { RoleSwitcher } from './RoleSwitcher';
import {
  Bell,
  Search,
  Menu,
  LogOut,
  User as UserIcon,
  CheckCheck,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

interface TopbarProps {
  onToggleMobileNav: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileNav }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const notifications = dataService.getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      if (user?.role === 'employee') {
        navigate(`/portal/tickets?search=${encodeURIComponent(searchVal.trim())}`);
      } else if (user?.role === 'agent') {
        navigate(`/agent/tickets?search=${encodeURIComponent(searchVal.trim())}`);
      } else {
        navigate(`/analytics/overview?search=${encodeURIComponent(searchVal.trim())}`);
      }
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-surface border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile hamburger & search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onToggleMobileNav}
          className="p-2 rounded-lg text-slate-500 hover:text-text-primary hover:bg-slate-100 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full hidden sm:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tickets, IDs, or issues (e.g. TKT-00850, VPN)..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-9 pr-14 h-9 text-xs bg-surface-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-text-primary transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden xl:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
            ↵ Enter
          </kbd>
        </form>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Unobtrusive Demo Environment Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-surface-subtle text-text-secondary border border-border select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Demo Environment · Synthetic Data</span>
        </div>

        {/* Compact Role Switcher */}
        <div className="hidden lg:flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role:</span>
          <RoleSwitcher compact />
        </div>

        <button
          onClick={() => setShowRoleModal(!showRoleModal)}
          title="Switch Role"
          aria-label="Switch Role"
          className="p-2 rounded-lg text-slate-500 hover:text-text-primary hover:bg-slate-100 lg:hidden"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:text-text-primary hover:bg-slate-100 relative transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-xl border border-border shadow-popover z-50 overflow-hidden animate-fade-in">
              <div className="p-3 border-b border-border flex items-center justify-between bg-surface-subtle">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.2 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={() => dataService.markAllNotificationsRead()}
                  className="text-[11px] text-brand-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      dataService.markNotificationRead(n.id);
                      if (n.link) navigate(n.link);
                      setShowNotifications(false);
                    }}
                    className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                      !n.read ? 'bg-indigo-50/25' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-text-primary">{n.title}</p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.createdAt}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">{n.message}</p>
                    {n.link && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-brand-600 font-medium mt-1.5">
                        Open details <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-2.5 border-t border-border bg-surface-subtle text-center">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-brand-600 hover:underline font-medium"
                >
                  View all activity history
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover border border-border"
            />
            <div className="text-left hidden md:block">
              <span className="text-xs font-semibold text-text-primary block leading-tight">
                {user?.name || 'Guest User'}
              </span>
              <span className="text-[10px] text-text-secondary capitalize block leading-tight font-medium">
                {user?.role || 'employee'} • {user?.departmentName?.split(' ')[0]}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl border border-border shadow-popover z-50 p-1.5 animate-fade-in">
              <div className="px-3 py-2.5 border-b border-border mb-1">
                <p className="text-xs font-bold text-text-primary">{user?.name}</p>
                <p className="text-[11px] text-text-secondary truncate">{user?.email}</p>
                <span className="inline-block mt-1.5 text-[10px] font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded capitalize border border-brand-200">
                  {user?.role} Portal
                </span>
              </div>

              <Link
                to="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Account Profile</span>
              </Link>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Role modal on mobile */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl max-w-sm w-full p-4 border border-border shadow-modal">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-text-primary">Demo Role Selector</span>
              <button onClick={() => setShowRoleModal(false)} className="text-slate-400 text-sm">✕</button>
            </div>
            <RoleSwitcher />
          </div>
        </div>
      )}
    </header>
  );
};
