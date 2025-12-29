import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useKeycloakInit } from './hooks/useKeycloakInit';
import { KeycloakProvider } from './context/KeycloakContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LoginPage from './pages/LoginPage';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AdminRedirect from './pages/AdminRedirect';
import UserManagement from './pages/UserManagement';
import PolicyManagement from './pages/PolicyManagement';
import Patients from './pages/Patients';
import PatientLookup from './pages/PatientLookup';
import QueueManagement from './pages/QueueManagement';
import NurseScreening from './pages/NurseScreening';

import InternalMedicineLabProcessing from './pages/InternalMedicineLabProcessing';
import InternalMedicineNurseReview from './pages/InternalMedicineNurseReview';
import InternalMedicineDoctorReview from './pages/InternalMedicineDoctorReview';
import HealthCheckExamination from './pages/HealthCheckExamination';
import Departments from './pages/Departments';
import CareTeams from './pages/CareTeams';
import MedicalRecords from './pages/MedicalRecords';
import PrescriptionWorkspace from './pages/PrescriptionWorkspace';
import Pharmacy from './pages/Pharmacy';
import Billing from './pages/Billing';
import Referrals from './pages/Referrals';
import Consents from './pages/Consents';
import EmergencyAccess from './pages/EmergencyAccess';
import PatientProfile from './pages/PatientProfile';
import LabOrders from './pages/LabOrders';
import TeamManagement from './pages/TeamManagement';
import Complaints from './pages/Complaints';
import ApprovalCenter from './pages/ApprovalCenter';
import ScheduleApproval from './pages/ScheduleApproval';
import SupplyManagement from './pages/SupplyManagement';
import FinancialReports from './pages/FinancialReports';
import BHYTManagement from './pages/BHYTManagement';
import Appointments from './pages/Appointments';
import HospitalReports from './pages/HospitalReports';
import AccessLogs from './pages/AccessLogs';
import Reports from './pages/Reports';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '', stack: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Rendering error', stack: error?.stack || '' };
  }
  componentDidCatch(error, info) {
    console.error('App render error:', error);
    console.error('App component stack:', info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <div style={{ color: 'red', marginBottom: 8 }}>Đã xảy ra lỗi khi hiển thị ứng dụng.</div>
          <div style={{ color: '#666', marginBottom: 12 }}>{this.state.message}</div>
          {this.state.stack && (
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 12, borderRadius: 4, color: '#333' }}>
              {this.state.stack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

function App() {
  const { keycloak, isLoading, error, initialized } = useKeycloakInit();

  if (error) {
    console.error('Keycloak initialization error:', error);
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '18px', backgroundColor: '#f5f5f5', flexDirection: 'column', gap: '20px' }}>
        <div style={{ color: 'red' }}>Error initializing Keycloak</div>
        <div style={{ color: '#666', fontSize: '14px', fontFamily: 'monospace' }}>{error.message}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '18px', backgroundColor: '#f5f5f5' }}>
        Loading Keycloak...
      </div>
    );
  }

  if (!keycloak || !initialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '18px', backgroundColor: '#f5f5f5' }}>
        Keycloak not initialized
      </div>
    );
  }

  if (!keycloak.authenticated) {
    return (
      <AppErrorBoundary>
        <KeycloakProvider keycloak={keycloak} isLoading={isLoading} initialized={initialized}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <LoginPage />
          </ThemeProvider>
        </KeycloakProvider>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <KeycloakProvider keycloak={keycloak} isLoading={isLoading} initialized={initialized}>
        <WebSocketProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
              <AuthProvider>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/*"
                    element={
                      keycloak.authenticated ? (
                        <Layout>
                          <Routes>
                            <Route
                              path="/"
                              element={
                                <ProtectedRoute>
                                  {(() => {
                                    const realmRoles = keycloak.tokenParsed?.realm_access?.roles || [];
                                    const userRoles = Array.isArray(realmRoles) ? realmRoles.map((r) => String(r || '')) : [];
                                    const isAdmin = userRoles.includes('admin');
                                    return isAdmin ? <AdminRedirect /> : <Dashboard />;
                                  })()}
                                </ProtectedRoute>
                              }
                            />
                            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                            <Route path="/users" element={<ProtectedRoute requiredRoles={['admin']}><UserManagement /></ProtectedRoute>} />
                            <Route path="/policies" element={<ProtectedRoute requiredRoles={['admin']}><PolicyManagement /></ProtectedRoute>} />
                            <Route path="/patients" element={<ProtectedRoute requiredRoles={['receptionist', 'head_reception', 'nurse', 'head_nurse']}><Patients /></ProtectedRoute>} />
                            <Route path="/patient-lookup" element={<ProtectedRoute requiredRoles={['doctor']}><PatientLookup /></ProtectedRoute>} />
                            <Route path="/queue-management" element={<ProtectedRoute requiredRoles={['receptionist', 'head_reception']}><QueueManagement /></ProtectedRoute>} />
                            <Route path="/nurse-screening" element={<ProtectedRoute requiredRoles={['nurse', 'head_nurse']}><NurseScreening /></ProtectedRoute>} />

                            <Route path="/internal-medicine-lab-processing" element={<ProtectedRoute requiredRoles={['lab_technician']}><InternalMedicineLabProcessing /></ProtectedRoute>} />
                            <Route path="/internal-medicine-doctor-first-review" element={<ProtectedRoute requiredRoles={['doctor', 'doctor_general']}><InternalMedicineNurseReview /></ProtectedRoute>} />
                            <Route path="/internal-medicine-doctor-review" element={<ProtectedRoute requiredRoles={['doctor']}><InternalMedicineDoctorReview /></ProtectedRoute>} />
                            <Route path="/health-check-examination" element={<ProtectedRoute requiredRoles={['doctor', 'doctor_general', 'doctor_pediatrics', 'doctor_surgery', 'doctor_obgyn', 'doctor_ent', 'doctor_ophthalmology', 'doctor_dentomaxillofacial']}><HealthCheckExamination /></ProtectedRoute>} />
                            <Route path="/departments" element={<ProtectedRoute requiredRoles={['admin']}><Departments /></ProtectedRoute>} />
                            <Route path="/care-teams" element={<ProtectedRoute requiredRoles={['doctor', 'nurse', 'head_nurse']}><CareTeams /></ProtectedRoute>} />
                            <Route path="/medical-records" element={<ProtectedRoute requiredRoles={['doctor', 'nurse', 'head_nurse']}><MedicalRecords /></ProtectedRoute>} />
                            <Route path="/prescriptions" element={<ProtectedRoute requiredRoles={['doctor', 'nurse', 'head_nurse']}><PrescriptionWorkspace /></ProtectedRoute>} />
                            <Route path="/pharmacy" element={<ProtectedRoute requiredRoles={['pharmacist']}><Pharmacy /></ProtectedRoute>} />
                            <Route path="/billing" element={<ProtectedRoute requiredRoles={['accountant', 'receptionist', 'head_reception']}><Billing /></ProtectedRoute>} />
                            <Route path="/referrals" element={<ProtectedRoute requiredRoles={['admin', 'doctor', 'specialist']}><Referrals /></ProtectedRoute>} />
                            <Route path="/consents" element={<ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse']}><Consents /></ProtectedRoute>} />
                            <Route path="/emergency-access" element={<ProtectedRoute requiredRoles={['doctor', 'nurse', 'head_nurse']}><EmergencyAccess /></ProtectedRoute>} />
                            <Route path="/my-profile" element={<ProtectedRoute requiredRoles={['patient']}><PatientProfile /></ProtectedRoute>} />
                            <Route path="/lab-orders" element={<ProtectedRoute requiredRoles={['lab_technician']}><LabOrders /></ProtectedRoute>} />
                            <Route path="/team-management" element={<ProtectedRoute requiredRoles={['head_reception', 'head_nurse']}><TeamManagement /></ProtectedRoute>} />
                            <Route path="/complaints" element={<ProtectedRoute requiredRoles={['head_reception']}><Complaints /></ProtectedRoute>} />
                            <Route path="/approval-center" element={<ProtectedRoute requiredRoles={['head_reception']}><ApprovalCenter /></ProtectedRoute>} />
                            <Route path="/schedule-approval" element={<ProtectedRoute requiredRoles={['head_nurse']}><ScheduleApproval /></ProtectedRoute>} />
                            <Route path="/supply-management" element={<ProtectedRoute requiredRoles={['head_nurse']}><SupplyManagement /></ProtectedRoute>} />
                            <Route path="/financial-reports" element={<ProtectedRoute requiredRoles={['accountant']}><FinancialReports /></ProtectedRoute>} />
                            <Route path="/bhyt-management" element={<ProtectedRoute requiredRoles={['accountant']}><BHYTManagement /></ProtectedRoute>} />
                            <Route path="/appointments" element={<ProtectedRoute requiredRoles={['receptionist', 'head_reception']}><Appointments /></ProtectedRoute>} />
                            <Route path="/hospital-reports" element={<ProtectedRoute requiredRoles={['admin_hospital']}><HospitalReports /></ProtectedRoute>} />
                            <Route path="/access-logs" element={<ProtectedRoute requiredRoles={['admin']}><AccessLogs /></ProtectedRoute>} />
                            <Route path="/reports" element={<ProtectedRoute requiredRoles={['admin']}><Reports /></ProtectedRoute>} />
                            <Route path="*" element={<Navigate to="/" />} />
                          </Routes>
                        </Layout>
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    }
                  />
                </Routes>
              </AuthProvider>
            </Router>
          </ThemeProvider>
        </WebSocketProvider>
      </KeycloakProvider>
    </AppErrorBoundary>
  );
}

export default App;
