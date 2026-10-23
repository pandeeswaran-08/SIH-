import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavView } from './components/Sidebar';
import type { User, Role } from './types';
import { api } from './services/api';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ApplicationWizard } from './pages/ApplicationWizard';
import { ApplicationQueue } from './pages/ApplicationQueue';
import { ApplicationDetails } from './pages/ApplicationDetails';
import { DocumentViewer } from './pages/DocumentViewer';
import { ValidationWorkspace } from './pages/ValidationWorkspace';
import { RiskExplorer } from './pages/RiskExplorer';
import { ValidationReportView } from './pages/ValidationReportView';
import { AlertsCaseManagement } from './pages/AlertsCaseManagement';
import { InstitutionalHistoryView } from './pages/InstitutionalHistoryView';
import { RulesManagement } from './pages/RulesManagement';
import { UserAdmin } from './pages/UserAdmin';
import { AuditTrail } from './pages/AuditTrail';
import { SystemSettings } from './pages/SystemSettings';

export function App() {
  // Demo initial user is Validation Officer so reviewer can immediately explore
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 1,
    email: 'officer@aicte.gov.in',
    full_name: 'P. K. Narayanan',
    role: 'VALIDATION_OFFICER',
    is_active: true
  });

  const [currentView, setCurrentView] = useState<NavView | 'login'>('dashboard');
  const [selectedAppId, setSelectedAppId] = useState<number>(1);
  const [unresolvedAlertsCount, setUnresolvedAlertsCount] = useState<number>(1);

  // Poll alerts count for badge
  useEffect(() => {
    if (!currentUser) return;
    const fetchAlertCount = async () => {
      try {
        const alerts = await api.getAlerts(true);
        setUnresolvedAlertsCount(alerts.length);
      } catch (e) {
        // Fallback default
        setUnresolvedAlertsCount(1);
      }
    };
    fetchAlertCount();
  }, [currentUser, currentView]);

  const handleRoleSwitch = (role: Role) => {
    const roleNames: Record<Role, string> = {
      VALIDATION_OFFICER: 'P. K. Narayanan (Validation Officer)',
      SENIOR_REVIEWING_OFFICER: 'Dr. S. K. Roy (Senior Reviewing Officer)',
      APPLICANT: 'Dr. Ramesh Kumar (Apex Institute Principal)',
      SYSTEM_ADMINISTRATOR: 'Tech Admin (System Administrator)',
      AUDITOR: 'CAG Inspection Unit (Auditor)'
    };
    const emails: Record<Role, string> = {
      VALIDATION_OFFICER: 'officer@aicte.gov.in',
      SENIOR_REVIEWING_OFFICER: 'senior.officer@aicte.gov.in',
      APPLICANT: 'applicant@institute.edu',
      SYSTEM_ADMINISTRATOR: 'admin@aicte.gov.in',
      AUDITOR: 'auditor@aicte.gov.in'
    };

    setCurrentUser({
      id: currentUser ? currentUser.id : 1,
      email: emails[role] || 'officer@aicte.gov.in',
      full_name: roleNames[role] || role,
      role: role,
      is_active: true
    });
  };

  const handleLoginSuccess = (user: User, _token: string) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  // If user signed out or viewing login
  if (!currentUser || currentView === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 flex flex-col font-serif text-slate-900">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onRoleSwitch={handleRoleSwitch}
        unresolvedAlertsCount={unresolvedAlertsCount}
        onNavigateToAlerts={() => setCurrentView('alerts')}
      />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          currentView={currentView as NavView}
          onNavigate={(view: NavView) => setCurrentView(view)}
          unresolvedAlertsCount={unresolvedAlertsCount}
        />

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gradient-to-br from-slate-50/80 via-white to-blue-50/10">
          <div className="max-w-7xl mx-auto space-y-7">
            
            {/* 1. Executive Dashboard */}
            {currentView === 'dashboard' && (
              <Dashboard
                onSelectApplication={(id) => {
                  setSelectedAppId(id);
                  setCurrentView('details');
                }}
                onNavigateToQueue={() => setCurrentView('queue')}
                onNavigateToWizard={() => setCurrentView('wizard')}
              />
            )}

            {/* 2. Application Submission Wizard */}
            {currentView === 'wizard' && (
              <ApplicationWizard
                onApplicationCreated={(newId) => {
                  setSelectedAppId(newId);
                  setCurrentView('details');
                }}
                onCancel={() => setCurrentView('queue')}
              />
            )}

            {/* 3. Application Queue */}
            {currentView === 'queue' && (
              <ApplicationQueue
                onSelectApplication={(id) => {
                  setSelectedAppId(id);
                  setCurrentView('details');
                }}
                onNavigateToWorkspace={(id) => {
                  setSelectedAppId(id);
                  setCurrentView('workspace');
                }}
                onNavigateToReport={(id) => {
                  setSelectedAppId(id);
                  setCurrentView('report');
                }}
              />
            )}

            {/* 4. Application Details */}
            {currentView === 'details' && (
              <ApplicationDetails
                applicationId={selectedAppId}
                onBack={() => setCurrentView('queue')}
                onNavigateToWorkspace={(id) => {
                  setSelectedAppId(id);
                  setCurrentView('workspace');
                }}
                onNavigateToReport={(id) => {
                  setSelectedAppId(id);
                  setCurrentView('report');
                }}
                onNavigateToDocViewer={(id) => {
                  setSelectedAppId(id);
                  setCurrentView('document-viewer');
                }}
                onNavigateToHistory={(id) => {
                  setSelectedAppId(id);
                  setCurrentView('history');
                }}
              />
            )}

            {/* 5. Document Viewer & OCR */}
            {currentView === 'document-viewer' && (
              <DocumentViewer
                applicationId={selectedAppId}
                onBack={() => setCurrentView('details')}
              />
            )}

            {/* 6. 5 Parallel Validation Modules Workspace */}
            {currentView === 'workspace' && (
              <ValidationWorkspace
                applicationId={selectedAppId}
                onBack={() => setCurrentView('details')}
                onNavigateToReport={(id) => {
                  setSelectedAppId(id);
                  setCurrentView('report');
                }}
                onNavigateToRisk={(id) => {
                  setSelectedAppId(id);
                  setCurrentView('risk');
                }}
              />
            )}

            {/* 7. Risk & Evidence Explorer */}
            {currentView === 'risk' && (
              <RiskExplorer
                applicationId={selectedAppId}
                onBack={() => setCurrentView('details')}
                onNavigateToReport={(id) => {
                  setSelectedAppId(id);
                  setCurrentView('report');
                }}
              />
            )}

            {/* 8. Validation Report Dossier */}
            {currentView === 'report' && (
              <ValidationReportView
                applicationId={selectedAppId}
                onBack={() => setCurrentView('details')}
              />
            )}

            {/* 9. Alerts & Case Management */}
            {currentView === 'alerts' && (
              <AlertsCaseManagement
                onSelectApplication={(id) => {
                  setSelectedAppId(id);
                  setCurrentView('details');
                }}
              />
            )}

            {/* 10. Institutional History Comparison */}
            {currentView === 'history' && (
              <InstitutionalHistoryView
                applicationId={selectedAppId}
                onBack={() => setCurrentView('details')}
              />
            )}

            {/* 11. Checklist & Rules Management */}
            {currentView === 'rules' && <RulesManagement />}

            {/* 12. User & Role Administration */}
            {currentView === 'users' && (
              <UserAdmin
                currentUser={currentUser}
                onRoleSwitch={handleRoleSwitch}
              />
            )}

            {/* 13. Tamper-Evident SHA-256 Audit Trail */}
            {currentView === 'audit' && <AuditTrail />}

            {/* 14. System Settings & Processing Health */}
            {currentView === 'system' && <SystemSettings />}

          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
