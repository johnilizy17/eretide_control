import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Approvals } from './pages/Approvals';
import { Accounts } from './pages/Accounts';
import { Transfers } from './pages/Transfers';
import { Monitoring } from './pages/Monitoring';
import { Reports } from './pages/Reports';
import { ReportDetail } from './pages/ReportDetail';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="transfers" element={<Transfers />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="branches" element={<Reports />} />
          <Route path="zones" element={<Reports />} />
          <Route path="communities" element={<Reports />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/:id" element={<ReportDetail />} />
          <Route path="freeze-restrict" element={<Accounts />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="settings" element={<Settings/>}/>
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
