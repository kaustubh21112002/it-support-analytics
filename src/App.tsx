import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';

import { DashboardSkeleton } from './components/common/Skeleton';

// Route Loading Skeleton Fallback
const RouteLoadingFallback: React.FC = () => (
  <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
    <DashboardSkeleton pageTitle="View" />
  </div>
);

// Public & Auth (Code-split chunks)
const LandingPage = React.lazy(() => import('./pages/public/LandingPage').then(m => ({ default: m.LandingPage })));
const RequestAccessPage = React.lazy(() => import('./pages/public/RequestAccessPage').then(m => ({ default: m.RequestAccessPage })));
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

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
export { ErrorBoundary };

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
            {/* Public routes without AppShell */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/request-access" element={<RequestAccessPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify" element={<VerifyOtpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/403" element={<ForbiddenPage />} />

            {/* Authenticated routes with AppShell and ProtectedRoute guards */}
            {/* Employee portal */}
            <Route
              path="/portal"
              element={
                <ProtectedRoute allowedRoles={['employee', 'manager', 'admin']}>
                  <AppShell><EmployeeHome /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/tickets"
              element={
                <ProtectedRoute allowedRoles={['employee', 'agent', 'manager', 'admin']}>
                  <AppShell><MyTicketsPage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/tickets/new"
              element={
                <ProtectedRoute allowedRoles={['employee', 'agent', 'manager', 'admin']}>
                  <AppShell><CreateTicketPage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/tickets/:id"
              element={
                <ProtectedRoute allowedRoles={['employee', 'agent', 'manager', 'admin']}>
                  <AppShell><EmployeeTicketDetail /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/assistant"
              element={
                <ProtectedRoute allowedRoles={['employee', 'agent', 'manager', 'admin']}>
                  <AppShell><AIAssistantPage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/knowledge"
              element={
                <ProtectedRoute allowedRoles={['employee', 'agent', 'manager', 'admin']}>
                  <AppShell><KnowledgeBasePage /></AppShell>
                </ProtectedRoute>
              }
            />

            {/* Agent workspace */}
            <Route
              path="/agent"
              element={
                <ProtectedRoute allowedRoles={['agent', 'manager', 'admin']}>
                  <AppShell><AgentHome /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/tickets"
              element={
                <ProtectedRoute allowedRoles={['agent', 'manager', 'admin']}>
                  <AppShell><TicketQueuePage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/tickets/:id"
              element={
                <ProtectedRoute allowedRoles={['agent', 'manager', 'admin']}>
                  <AppShell><AgentTicketDetail /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets/:id"
              element={
                <ProtectedRoute allowedRoles={['agent', 'manager', 'admin']}>
                  <AppShell><AgentTicketDetail /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/workload"
              element={
                <ProtectedRoute allowedRoles={['agent', 'manager', 'admin']}>
                  <AppShell><WorkloadPage /></AppShell>
                </ProtectedRoute>
              }
            />

            {/* Management analytics */}
            <Route
              path="/analytics/overview"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <AppShell><AnalyticsOverview /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/executive"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <AppShell><AnalyticsOverview /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/trends"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <AppShell><TicketTrendsPage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/resolution"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <AppShell><ResolutionPerformancePage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/sla"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <AppShell><SlaCommandCenterPage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/teams"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <AppShell><TeamPerformancePage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/departments"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <AppShell><DepartmentAnalysisPage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/issues"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <AppShell><RecurringIssuesPage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/predictions"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <AppShell><PredictionsPage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/reports"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <AppShell><ReportsExportPage /></AppShell>
                </ProtectedRoute>
              }
            />

            {/* Administration & Governance */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <AppShell><AdminOverview /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppShell><UserManagementPage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sla"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppShell><SlaConfigPage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/data"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <AppShell><DataWorkbenchPage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/upload"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppShell><AdminUploadPage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/security"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppShell><SecuritySettingsPage /></AppShell>
                </ProtectedRoute>
              }
            />

            {/* Shared pages */}
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={['employee', 'agent', 'manager', 'admin']}>
                  <AppShell><NotificationsPage /></AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['employee', 'agent', 'manager', 'admin']}>
                  <AppShell><ProfilePage /></AppShell>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AuthProvider>
  </BrowserRouter>
  );
};

export default App;
