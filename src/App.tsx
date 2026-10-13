import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';

// Route Loading Spinner Fallback
const RouteLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[45vh] p-8">
    <div className="flex flex-col items-center gap-2.5">
      <div className="w-7 h-7 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      <span className="text-xs font-medium text-text-secondary">Loading view...</span>
    </div>
  </div>
);

// Public & Auth (Code-split chunks)
const LandingPage = React.lazy(() => import('./pages/public/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const VerifyOtpPage = React.lazy(() => import('./pages/auth/VerifyOtpPage').then(m => ({ default: m.VerifyOtpPage })));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/PasswordResetPages').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/PasswordResetPages').then(m => ({ default: m.ResetPasswordPage })));
const ForbiddenPage = React.lazy(() => import('./pages/auth/PasswordResetPages').then(m => ({ default: m.ForbiddenPage })));
const NotFoundPage = React.lazy(() => import('./pages/auth/PasswordResetPages').then(m => ({ default: m.NotFoundPage })));

// Employee Portal (Code-split chunks)
const EmployeeHome = React.lazy(() => import('./pages/portal/EmployeeHome').then(m => ({ default: m.EmployeeHome })));
const CreateTicketPage = React.lazy(() => import('./pages/portal/CreateTicketPage').then(m => ({ default: m.CreateTicketPage })));
const MyTicketsPage = React.lazy(() => import('./pages/portal/MyTicketsPage').then(m => ({ default: m.MyTicketsPage })));
const EmployeeTicketDetail = React.lazy(() => import('./pages/portal/EmployeeTicketDetail').then(m => ({ default: m.EmployeeTicketDetail })));
const AIAssistantPage = React.lazy(() => import('./pages/portal/AIAssistantPage').then(m => ({ default: m.AIAssistantPage })));
const KnowledgeBasePage = React.lazy(() => import('./pages/portal/KnowledgeBasePage').then(m => ({ default: m.KnowledgeBasePage })));

// Agent Workspace (Code-split chunks)
const AgentHome = React.lazy(() => import('./pages/agent/AgentHome').then(m => ({ default: m.AgentHome })));
const TicketQueuePage = React.lazy(() => import('./pages/agent/TicketQueuePage').then(m => ({ default: m.TicketQueuePage })));
const AgentTicketDetail = React.lazy(() => import('./pages/agent/AgentTicketDetail').then(m => ({ default: m.AgentTicketDetail })));
const WorkloadPage = React.lazy(() => import('./pages/agent/WorkloadPage').then(m => ({ default: m.WorkloadPage })));

// Analytics & SLA (Code-split chunks)
const AnalyticsOverview = React.lazy(() => import('./pages/analytics/AnalyticsOverview').then(m => ({ default: m.AnalyticsOverview })));
const TicketTrendsPage = React.lazy(() => import('./pages/analytics/DeepDivePages').then(m => ({ default: m.TicketTrendsPage })));
const ResolutionPerformancePage = React.lazy(() => import('./pages/analytics/DeepDivePages').then(m => ({ default: m.ResolutionPerformancePage })));
const TeamPerformancePage = React.lazy(() => import('./pages/analytics/DeepDivePages').then(m => ({ default: m.TeamPerformancePage })));
const DepartmentAnalysisPage = React.lazy(() => import('./pages/analytics/DeepDivePages').then(m => ({ default: m.DepartmentAnalysisPage })));
const RecurringIssuesPage = React.lazy(() => import('./pages/analytics/DeepDivePages').then(m => ({ default: m.RecurringIssuesPage })));
const ReportsExportPage = React.lazy(() => import('./pages/analytics/DeepDivePages').then(m => ({ default: m.ReportsExportPage })));
const SlaCommandCenterPage = React.lazy(() => import('./pages/analytics/SlaCommandCenterPage').then(m => ({ default: m.SlaCommandCenterPage })));
const PredictionsPage = React.lazy(() => import('./pages/analytics/PredictionsPage').then(m => ({ default: m.PredictionsPage })));

// Administration & Governance (Code-split chunks)
const AdminOverview = React.lazy(() => import('./pages/admin/AdminPages').then(m => ({ default: m.AdminOverview })));
const UserManagementPage = React.lazy(() => import('./pages/admin/AdminPages').then(m => ({ default: m.UserManagementPage })));
const SlaConfigPage = React.lazy(() => import('./pages/admin/AdminPages').then(m => ({ default: m.SlaConfigPage })));
const DataWorkbenchPage = React.lazy(() => import('./pages/admin/AdminPages').then(m => ({ default: m.DataWorkbenchPage })));
const AdminUploadPage = React.lazy(() => import('./pages/admin/AdminUploadPage').then(m => ({ default: m.AdminUploadPage })));
const SecuritySettingsPage = React.lazy(() => import('./pages/admin/AdminPages').then(m => ({ default: m.SecuritySettingsPage })));

// Shared
const NotificationsPage = React.lazy(() => import('./pages/shared/SharedPages').then(m => ({ default: m.NotificationsPage })));
const ProfilePage = React.lazy(() => import('./pages/shared/SharedPages').then(m => ({ default: m.ProfilePage })));

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
          {/* Public routes without AppShell */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/403" element={<ForbiddenPage />} />

          {/* Authenticated routes with AppShell */}
          {/* Employee portal */}
          <Route path="/portal" element={<AppShell><EmployeeHome /></AppShell>} />
          <Route path="/portal/tickets" element={<AppShell><MyTicketsPage /></AppShell>} />
          <Route path="/portal/tickets/new" element={<AppShell><CreateTicketPage /></AppShell>} />
          <Route path="/portal/tickets/:id" element={<AppShell><EmployeeTicketDetail /></AppShell>} />
          <Route path="/portal/assistant" element={<AppShell><AIAssistantPage /></AppShell>} />
          <Route path="/portal/knowledge" element={<AppShell><KnowledgeBasePage /></AppShell>} />

          {/* Agent workspace */}
          <Route path="/agent" element={<AppShell><AgentHome /></AppShell>} />
          <Route path="/agent/tickets" element={<AppShell><TicketQueuePage /></AppShell>} />
          <Route path="/agent/tickets/:id" element={<AppShell><AgentTicketDetail /></AppShell>} />
          <Route path="/agent/workload" element={<AppShell><WorkloadPage /></AppShell>} />

          {/* Management analytics */}
          <Route path="/analytics/overview" element={<AppShell><AnalyticsOverview /></AppShell>} />
          <Route path="/analytics/trends" element={<AppShell><TicketTrendsPage /></AppShell>} />
          <Route path="/analytics/resolution" element={<AppShell><ResolutionPerformancePage /></AppShell>} />
          <Route path="/analytics/sla" element={<AppShell><SlaCommandCenterPage /></AppShell>} />
          <Route path="/analytics/teams" element={<AppShell><TeamPerformancePage /></AppShell>} />
          <Route path="/analytics/departments" element={<AppShell><DepartmentAnalysisPage /></AppShell>} />
          <Route path="/analytics/issues" element={<AppShell><RecurringIssuesPage /></AppShell>} />
          <Route path="/analytics/predictions" element={<AppShell><PredictionsPage /></AppShell>} />
          <Route path="/analytics/reports" element={<AppShell><ReportsExportPage /></AppShell>} />

          {/* Administration */}
          <Route path="/admin" element={<AppShell><AdminOverview /></AppShell>} />
          <Route path="/admin/users" element={<AppShell><UserManagementPage /></AppShell>} />
          <Route path="/admin/sla" element={<AppShell><SlaConfigPage /></AppShell>} />
          <Route path="/admin/data" element={<AppShell><DataWorkbenchPage /></AppShell>} />
          <Route path="/admin/upload" element={<AppShell><AdminUploadPage /></AppShell>} />
          <Route path="/admin/security" element={<AppShell><SecuritySettingsPage /></AppShell>} />

          {/* Shared pages */}
          <Route path="/notifications" element={<AppShell><NotificationsPage /></AppShell>} />
          <Route path="/profile" element={<AppShell><ProfilePage /></AppShell>} />

          {/* Fallback */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
  );
};

export default App;
