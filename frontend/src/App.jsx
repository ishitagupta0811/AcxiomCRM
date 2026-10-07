import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Leads from './pages/Leads';
import Opportunities from './pages/Opportunities';
import FollowUps from './pages/FollowUps';
import AuditLogs from './pages/AuditLogs';
import ApiExplorer from './pages/ApiExplorer';
import { AuthService } from './services/authService';

export default function App() {
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  const [currentView, setCurrentView] = useState(currentUser ? 'dashboard' : 'landing');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
    if (!user && (currentView === 'dashboard' || currentView === 'customers' || currentView === 'leads' || currentView === 'opportunities' || currentView === 'followups' || currentView === 'audit' || currentView === 'api')) {
      setCurrentView('login');
    }
  }, [currentView]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setCurrentView('login');
    showToast('Logged out successfully.', 'info');
  };

  return (
    <div className="app-shell">
      {/* Toast notifications container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast alert-${t.type}`}>
            <span>{t.type === 'success' ? '✅' : (t.type === 'danger' ? '⚠️' : 'ℹ️')}</span>
            <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>{t.message}</div>
          </div>
        ))}
      </div>

      <Navbar
        currentView={currentView}
        setView={setCurrentView}
        user={currentUser}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1 }}>
        {currentView === 'landing' && (
          <Landing setView={setCurrentView} onLoginSuccess={handleLoginSuccess} showToast={showToast} />
        )}
        {currentView === 'login' && (
          <Login onLoginSuccess={handleLoginSuccess} setView={setCurrentView} showToast={showToast} />
        )}
        {currentView === 'register' && (
          <Register onLoginSuccess={handleLoginSuccess} setView={setCurrentView} showToast={showToast} />
        )}
        {currentView === 'dashboard' && (
          <Dashboard user={currentUser} setView={setCurrentView} showToast={showToast} />
        )}
        {currentView === 'customers' && (
          <Customers showToast={showToast} />
        )}
        {currentView === 'leads' && (
          <Leads showToast={showToast} />
        )}
        {currentView === 'opportunities' && (
          <Opportunities showToast={showToast} />
        )}
        {currentView === 'followups' && (
          <FollowUps showToast={showToast} />
        )}
        {currentView === 'audit' && (
          <AuditLogs user={currentUser} showToast={showToast} />
        )}
        {currentView === 'api' && (
          <ApiExplorer showToast={showToast} />
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'hsla(222, 47%, 10%, 0.6)' }}>
        AcxiomCRM Enterprise Architecture • React Client &amp; ASP.NET Core API Integration Baseline
      </footer>
    </div>
  );
}
