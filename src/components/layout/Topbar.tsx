import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService, useDataSync } from '../../services/dataService';
import { RoleSwitcher } from './RoleSwitcher';
import {
  Bell,
  Search,
  Menu,
  LogOut,
  User as UserIcon,
  CheckCheck,
  ExternalLink,
  ChevronDown,
  Headphones
} from 'lucide-react';

interface TopbarProps {
  onToggleMobileNav: () => void;
  isMobileNavOpen?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileNav, isMobileNavOpen = false }) => {
  const { user, logout, authMode, isDemoAuth } = useAuth();
  const navigate = useNavigate();
  const { dataSource, hydrationStatus, ticketCount, provenance } = useDataSync();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
    <header className="h-14 sm:h-16 bg-surface border-b border-border px-2.5 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs max-w-full overflow-hidden">
      {/* Left: Mobile hamburger, brand on small screens, and global search */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0 max-w-[150px] xs:max-w-[220px] sm:max-w-xs md:max-w-md">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-text-primary hover:bg-slate-100 md:hidden focus-visible:ring-2 focus-visible:ring-brand-500 shrink-0"
          aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileNavOpen}
          aria-controls="mobile-navigation-drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Compact Mobile Brand Icon */}
        <Link
          to="/"
          className="md:hidden flex items-center gap-1.5 text-xs font-bold text-text-primary shrink-0 mr-0.5"
          aria-label="IT Support Analytics Home"
        >
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-xs">
            <Headphones className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
        </Link>

        {/* Global Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full min-w-0" role="search">
          <label htmlFor="global-ticket-search" className="sr-only">
            Search tickets or IDs
          </label>
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            id="global-ticket-search"
            type="text"
            placeholder="Search tickets or IDs..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-7 sm:pl-9 pr-2.5 sm:pr-3 h-8 sm:h-9 text-xs bg-surface-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-text-primary transition-colors placeholder:text-slate-400"
          />
        </form>
      </div>

      {/* Right Controls: Compact Role Selector, Notifications, User Profile */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 ml-1.5 sm:ml-2">
        {/* Data Source & Operational Provenance Indicator */}
        <div className="hidden lg:flex items-center">
          {dataSource === 'live' && hydrationStatus === 'hydrated' ? (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
              title={`Live Supabase Dataset: ${ticketCount.toLocaleString()} operational records`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Operational ({ticketCount.toLocaleString()})</span>
            </span>
          ) : hydrationStatus === 'denied' ? (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200"
              title={provenance.diagnosticMessage}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Access Denied</span>
            </span>
          ) : hydrationStatus === 'error' ? (
            <div
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200"
              title={provenance.diagnosticMessage}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Sync Failed</span>
              <button
                type="button"
                onClick={() => dataService.hydrateFromSupabase({ force: true })}
                className="underline font-bold text-rose-800 hover:text-rose-950 ml-0.5 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : hydrationStatus === 'auth_required' ? (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
              title="Sign in with corporate credentials to synchronize live operational tickets"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Sign In for Live</span>
            </Link>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
              title={`Governed Demo Mode: ${ticketCount.toLocaleString()} synthetic records loaded.`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              <span>Demo Mode ({ticketCount.toLocaleString()})</span>
            </span>
          )}
        </div>

        {/* Compact Demo Role Selector */}
        <RoleSwitcher variant="dropdown" />

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-text-primary hover:bg-slate-100 relative transition-colors focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
            aria-expanded={showNotifications}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-surface rounded-xl border border-border shadow-popover z-50 overflow-hidden animate-fade-in">
              <div className="p-3 border-b border-border flex items-center justify-between bg-surface-subtle">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => dataService.markAllNotificationsRead()}
                    className="text-[11px] text-brand-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-text-secondary">
                    No active notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
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
                        <p className="font-semibold text-text-primary text-xs">{n.title}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.createdAt}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-1">{n.message}</p>
                      {n.link && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-brand-600 font-medium mt-1.5">
                          Open details <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-border bg-surface-subtle text-center">
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

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="User account menu"
            aria-expanded={showProfileMenu}
            aria-haspopup="true"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
              alt={user?.name || 'User profile'}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-border shrink-0"
            />
            <div className="text-left hidden md:block">
              <span className="text-xs font-semibold text-text-primary block leading-tight truncate max-w-[120px]">
                {user?.name || 'Guest User'}
              </span>
              <span className="text-[10px] text-text-secondary capitalize block leading-tight font-medium truncate max-w-[120px]">
                {user?.role || 'employee'} • {user?.departmentName?.split(' ')[0]}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block shrink-0" aria-hidden="true" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 sm:w-56 bg-surface rounded-xl border border-border shadow-popover z-50 p-1.5 animate-fade-in">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-xs font-bold text-text-primary truncate">{user?.name}</p>
                <p className="text-[11px] text-text-secondary truncate">{user?.email}</p>
                <div className="flex flex-col gap-1 mt-1.5">
                  <span className="inline-block text-[10px] font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded capitalize border border-brand-200">
                    {user?.role} Portal
                  </span>
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      authMode === 'supabase'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : isDemoAuth
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {authMode === 'supabase'
                      ? 'Verified Supabase Account'
                      : isDemoAuth
                      ? 'Simulated Demo Persona'
                      : 'Unauthenticated'}
                  </span>
                  <div className="text-[10px] text-slate-500 pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between">
                    <span>Dataset:</span>
                    <span className="font-semibold text-text-primary">
                      {dataSource === 'live' && hydrationStatus === 'hydrated'
                        ? `Live (${ticketCount.toLocaleString()})`
                        : `Demo (${ticketCount.toLocaleString()})`}
                    </span>
                  </div>
                </div>
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
                type="button"
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
    </header>
  );
};

