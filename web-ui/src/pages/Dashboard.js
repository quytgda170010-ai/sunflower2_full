import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalHospital as HospitalIcon,
  Business as BusinessIcon,
  Groups as GroupsIcon,
  Security as SecurityIcon,
  Block as BlockIcon,
  Assignment as AssignmentIcon,
  Medication as MedicationIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Queue as QueueIcon,
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useKeycloak } from '../context/KeycloakContext';

// Stat Card Component
function StatCard({ title, value, icon, color = 'primary', subtitle }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: `${color}.main` }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get user roles from Keycloak token - check both possible locations
  const getUserRoles = () => {
    if (!keycloak?.tokenParsed) return [];

    // Try realm_access.roles first (standard Keycloak location)
    const realmRoles = keycloak.tokenParsed.realm_access?.roles || [];
    // Try direct roles property (alternative location)
    const directRoles = keycloak.tokenParsed.roles || [];
    // Try resource_access roles (client-specific roles)
    const resourceRoles = Object.values(keycloak.tokenParsed.resource_access || {}).flatMap(
      (client) => client.roles || []
    );

    // Combine all roles and remove duplicates
    return [...new Set([...realmRoles, ...directRoles, ...resourceRoles])];
  };

  const userRoles = getUserRoles();

  // Helper function to check role (with username fallback)
  const hasRole = (role) => {
    if (userRoles.includes(role)) return true;

    // Fallback: check username if role not in token
    if (keycloak?.tokenParsed) {
      const username = (keycloak.tokenParsed.preferred_username || keycloak.tokenParsed.name || '').toLowerCase();

      // Username-based role mapping (fallback when Keycloak roles not assigned)
      if (role === 'receptionist' && (username.includes('letan') || username.includes('reception') || username.includes('tieptan'))) return true;
      if (role === 'head_reception' && (username.includes('truongletan') || username.includes('head_reception') || username.includes('truongtieptan'))) return true;
      if (role === 'doctor' && (username.includes('bacsi') || username.includes('doctor') || username.includes('bs'))) return true;
      if (role === 'nurse' && (username.includes('dieuduong') || username.includes('nurse') || username.includes('yd') || username.includes('dd'))) return true;
      if (role === 'head_nurse' && (username.includes('truongdieuduong') || username.includes('head_nurse') || username.includes('truongyd'))) return true;
      if (role === 'pharmacist' && (username.includes('duocsi') || username.includes('pharmacist') || username.includes('ds'))) return true;
      if (role === 'lab_technician' && (username.includes('ktv') || username.includes('lab') || username.includes('xetnghiem') || username.includes('technician'))) return true;
      if (role === 'accountant' && (username.includes('ketoan') || username.includes('accountant') || username.includes('thungan'))) return true;
      if (role === 'admin_hospital' && (username.includes('giamdoc') || username.includes('admin_hospital') || username.includes('hospital_admin'))) return true;
      if (role === 'admin' && (username.includes('admin') || username.includes('quanly') || username.includes('quantri'))) return true;
      if (role === 'patient' && (username.includes('benhnhan') || username.includes('patient') || username.includes('bn'))) return true;
    }

    return false;
  };

  const isAdmin = hasRole('admin');
  const isAdminHospital = hasRole('admin_hospital');
  const isReceptionist = hasRole('receptionist');
  const isHeadReception = hasRole('head_reception');
  const isDoctor = hasRole('doctor');
  const isNurse = hasRole('nurse');
  const isHeadNurse = hasRole('head_nurse');
  const isPharmacist = hasRole('pharmacist');
  const isLabTechnician = hasRole('lab_technician');
  const isAccountant = hasRole('accountant');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard/stats');
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Don't set dashboardStats to null if it's a 401/403 - user may still be authenticated
      // just doesn't have permission for this endpoint. Show welcome message instead.
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User may not have permission to view dashboard stats, showing welcome message');
        // Keep dashboardStats as null to show welcome message
        setDashboardStats(null);
      } else {
        setDashboardStats(null);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Dashboard
        </Typography>
        <Box>
          <Typography variant="body1" color="textSecondary">
            Chào mừng trở lại, <strong>{user?.name || keycloak?.tokenParsed?.preferred_username || 'User'}</strong>
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {userRoles.filter(role => !role.startsWith('default-') && !role.startsWith('offline_') && !role.startsWith('uma_')).map((role) => (
              <Chip
                key={role}
                label={role.toUpperCase()}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Admin Dashboard */}
      {isAdmin && !isAdminHospital && dashboardStats && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Tổng số Bệnh nhân"
              value={dashboardStats.total_patients || 0}
              icon={<HospitalIcon />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Tổng số Người dùng"
              value={dashboardStats.total_users || 0}
              icon={<PeopleIcon />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Khoa phòng"
              value={dashboardStats.total_departments || 0}
              icon={<BusinessIcon />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Đội chăm sóc"
              value={dashboardStats.total_care_teams || 0}
              icon={<GroupsIcon />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Truy cập hôm nay"
              value={dashboardStats.access_logs_today || 0}
              icon={<SecurityIcon />}
              color="primary"
              subtitle="Tổng số lượt truy cập"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Truy cập bị từ chối"
              value={dashboardStats.denied_access_today || 0}
              icon={<BlockIcon />}
              color="error"
              subtitle="Bị chặn hôm nay"
            />
          </Grid>
        </Grid>
      )}

      {/* Doctor Dashboard */}
      {isDoctor && (
        <Grid container spacing={3}>
          {dashboardStats ? (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Bệnh nhân của tôi"
                  value={dashboardStats.my_patients || 0}
                  icon={<HospitalIcon />}
                  color="primary"
                  subtitle="Bệnh nhân đang điều trị"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Hồ sơ bệnh án"
                  value={dashboardStats.my_medical_records || 0}
                  icon={<AssignmentIcon />}
                  color="info"
                  subtitle="Hồ sơ đã tạo"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Chờ Khám Lần Cuối"
                  value={dashboardStats.waiting_doctor_final_review_internal || 0}
                  icon={<HospitalIcon />}
                  color="primary"
                  subtitle="Chờ khám lột kết luận"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Đơn thuốc chờ duyệt"
                  value={dashboardStats.pending_prescriptions || 0}
                  icon={<MedicationIcon />}
                  color="warning"
                  subtitle="Đang chờ duyệt"
                />
              </Grid>

              {/* Recent Patients */}
              {dashboardStats.recent_patients && dashboardStats.recent_patients.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Bệnh nhân gần đây (7 ngày qua)
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Mã BN</TableCell>
                              <TableCell>Họ tên</TableCell>
                              <TableCell>Lần khám cuối</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {dashboardStats.recent_patients.map((patient, index) => (
                              <TableRow key={index}>
                                <TableCell>{patient.patient_code}</TableCell>
                                <TableCell>{patient.full_name}</TableCell>
                                <TableCell>{new Date(patient.last_visit).toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </>
          ) : (
            <Grid item xs={12}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 80, height: 80, mx: 'auto', mb: 3 }}>
                    <HospitalIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Chào mừng Bác sĩ!
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.95, mb: 2 }}>
                    Bạn có thể quản lý bệnh nhân, hồ sơ bệnh án và đơn thuốc.
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Sử dụng menu bên trái để truy cập các chức năng.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Nurse Dashboard */}
      {(isNurse || isHeadNurse) && !isDoctor && (
        <Grid container spacing={3}>
          {dashboardStats ? (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Bệnh nhân của tôi"
                  value={dashboardStats.my_patients || 0}
                  icon={<HospitalIcon />}
                  color="primary"
                  subtitle="Bệnh nhân đã làm việc"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Hồ sơ y tế"
                  value={dashboardStats.my_medical_records || 0}
                  icon={<AssignmentIcon />}
                  color="info"
                  subtitle="Hồ sơ đã tạo"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Chờ Sàng lọc"
                  value={dashboardStats.waiting_nurse_screening_internal || 0}
                  icon={<QueueIcon />}
                  color="warning"
                  subtitle="Chờ sàng lọc hồ sơ bệnh án"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Chờ Khám Lần 1"
                  value={dashboardStats.waiting_doctor_first_review_internal || 0}
                  icon={<AssignmentIcon />}
                  color="secondary"
                  subtitle="Chờ bác sĩ khám lần đầu"
                />
              </Grid>

              {/* Old Workflow - Other Departments */}
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Chờ Sàng lọc"
                  value={dashboardStats.waiting_screening || 0}
                  icon={<QueueIcon />}
                  color="warning"
                  subtitle="Các khoa khác"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Đang Sàng lọc"
                  value={dashboardStats.screened || 0}
                  icon={<AssignmentIcon />}
                  color="info"
                  subtitle="Các khoa khác"
                />
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 80, height: 80, mx: 'auto', mb: 3 }}>
                    <GroupsIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Chào mừng Y tá!
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.95, mb: 2 }}>
                    Bạn có thể quản lý bệnh nhân và hồ sơ chăm sóc.
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Sử dụng menu bên trái để truy cập các chức năng.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Accountant Dashboard */}
      {isAccountant && (
        <Grid container spacing={3}>
          {dashboardStats ? (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Tổng số Hóa đơn"
                  value={dashboardStats.total_bills || 0}
                  icon={<ReceiptIcon />}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Hóa đơn chờ TT"
                  value={dashboardStats.pending_bills || 0}
                  icon={<ReceiptIcon />}
                  color="warning"
                  subtitle="Chờ thanh toán"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Đã thanh toán"
                  value={dashboardStats.paid_bills || 0}
                  icon={<ReceiptIcon />}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Doanh thu tháng này"
                  value={`$${(dashboardStats.revenue_this_month || 0).toLocaleString()}`}
                  icon={<MoneyIcon />}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                          Thanh toán chờ xử lý
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          ${(dashboardStats.pending_amount || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Số tiền còn nợ
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                        <TrendingUpIcon />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 80, height: 80, mx: 'auto', mb: 3 }}>
                    <MoneyIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Chào mừng Kế toán!
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.95, mb: 2 }}>
                    Bạn có thể quản lý hóa đơn và doanh thu của bệnh viện.
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Sử dụng menu bên trái để truy cập các chức năng.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Receptionist Dashboard */}
      {(isReceptionist || isHeadReception) && (
        <Grid container spacing={3}>
          {dashboardStats && (
            <>
              {/* Queue Statistics */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Thống kê hàng chờ hôm nay
                </Typography>
              </Grid>

              {/* Workflow Nội khoa */}
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Chờ Y tá Sàng lọc"
                  value={dashboardStats.waiting_nurse_screening_internal || 0}
                  icon={<QueueIcon />}
                  color="warning"
                  subtitle="Quy trình Nội khoa"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Chờ Xử lý Xét nghiệm"
                  value={dashboardStats.waiting_lab_processing_internal || 0}
                  icon={<AssignmentIcon />}
                  color="info"
                  subtitle="Quy trình Nội khoa"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Chờ Khám Lần 1"
                  value={dashboardStats.waiting_doctor_first_review_internal || 0}
                  icon={<AssignmentIcon />}
                  color="secondary"
                  subtitle="Quy trình Nội khoa"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Chờ Khám Lần Cuối"
                  value={dashboardStats.waiting_doctor_final_review_internal || 0}
                  icon={<HospitalIcon />}
                  color="primary"
                  subtitle="Quy trình Nội khoa"
                />
              </Grid>

              {/* Old Workflow - Other Departments */}
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Chờ Sàng lọc (Các Khoa khác)"
                  value={dashboardStats.waiting_screening || 0}
                  icon={<QueueIcon />}
                  color="warning"
                  subtitle="Quy trình cũ"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Đang Sàng lọc (Các Khoa khác)"
                  value={dashboardStats.screened || 0}
                  icon={<AssignmentIcon />}
                  color="info"
                  subtitle="Quy trình cũ"
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 80, height: 80, mx: 'auto', mb: 3 }}>
                  <PeopleIcon fontSize="large" />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  Chào mừng {isHeadReception ? 'Trưởng Lễ tân' : 'Lễ tân'}!
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.95, mb: 2 }}>
                  Bạn có thể đăng ký bệnh nhân, quản lý lịch hẹn và thanh toán.
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Sử dụng menu bên trái để truy cập các chức năng.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Access Cards for Receptionist */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
                transition: 'box-shadow 0.3s, transform 0.3s'
              }}
              onClick={() => navigate('/queue-management')}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                  <QueueIcon fontSize="large" />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  Quản lý Hàng chờ
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
                transition: 'box-shadow 0.3s, transform 0.3s'
              }}
              onClick={() => navigate('/patients')}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{ bgcolor: 'success.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                  <HospitalIcon fontSize="large" />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  Bệnh nhân
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
                transition: 'box-shadow 0.3s, transform 0.3s'
              }}
              onClick={() => navigate('/billing')}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{ bgcolor: 'warning.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                  <ReceiptIcon fontSize="large" />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  Thanh toán
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
                transition: 'box-shadow 0.3s, transform 0.3s'
              }}
              onClick={() => navigate('/appointments')}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{ bgcolor: 'info.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                  <CalendarTodayIcon fontSize="large" />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  Lịch hẹn
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Pharmacist Dashboard */}
      {isPharmacist && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 80, height: 80, mx: 'auto', mb: 3 }}>
                  <MedicationIcon fontSize="large" />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  Chào mừng Dược sĩ!
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.95, mb: 2 }}>
                  Bạn có thể xem và cấp phát thuốc theo đơn của bác sĩ.
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Sử dụng menu bên trái để truy cập các chức năng.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Lab Technician Dashboard */}
      {isLabTechnician && (
        <Grid container spacing={3}>
          {dashboardStats ? (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard
                  title="Chờ Xét nghiệm"
                  value={dashboardStats.waiting_lab_processing_internal || 0}
                  icon={<AssignmentIcon />}
                  color="info"
                  subtitle="Chờ xét nghiệm lâm sàng"
                />
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Card sx={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 80, height: 80, mx: 'auto', mb: 3 }}>
                    <AssignmentIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Chào mừng Kỹ thuật viên Xét nghiệm!
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.95, mb: 2 }}>
                    Bạn có thể xem chỉ định xét nghiệm và cập nhật kết quả.
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Sử dụng menu bên trái để truy cập các chức năng.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Admin Hospital Dashboard */}
      {isAdminHospital && (
        <Grid container spacing={3}>
          {dashboardStats ? (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Tổng số Bệnh nhân"
                  value={dashboardStats.total_patients || 0}
                  icon={<HospitalIcon />}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Tổng số Người dùng"
                  value={dashboardStats.total_users || 0}
                  icon={<PeopleIcon />}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Khoa phòng"
                  value={dashboardStats.total_departments || 0}
                  icon={<BusinessIcon />}
                  color="info"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Doanh thu tháng này"
                  value={`$${(dashboardStats.revenue_this_month || 0).toLocaleString()}`}
                  icon={<MoneyIcon />}
                  color="success"
                />
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 80, height: 80, mx: 'auto', mb: 3 }}>
                    <BusinessIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Chào mừng Giám đốc!
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.95, mb: 2 }}>
                    Bạn có thể xem báo cáo và thống kê toàn viện.
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Sử dụng menu bên trái để truy cập các chức năng.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Default view for users without specific role dashboards */}
      {!isAdmin && !isAdminHospital && !isReceptionist && !isHeadReception && !isDoctor && !isNurse && !isHeadNurse && !isPharmacist && !isLabTechnician && !isAccountant && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  Chào mừng đến với EHR Sentinel!
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.95, mb: 3 }}>
                  Hệ thống quản lý hồ sơ bệnh án điện tử
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Please use the left menu to navigate to functions appropriate for your role.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Access Cards - Only show cards user has permission for */}
          {/* Patients Card - for receptionist, head_reception, nurse, head_nurse */}
          {(isReceptionist || isHeadReception || isNurse || isHeadNurse) && (
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
                  transition: 'box-shadow 0.3s, transform 0.3s'
                }}
                onClick={() => navigate('/patients')}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                    <HospitalIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    Patients
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Manage patient information
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Medical Records Card - for doctor, nurse, head_nurse */}
          {(isDoctor || isNurse || isHeadNurse) && (
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
                  transition: 'box-shadow 0.3s, transform 0.3s'
                }}
                onClick={() => navigate('/medical-records')}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Avatar sx={{ bgcolor: 'success.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                    <AssignmentIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    Medical Records
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    View and manage medical records
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Patient Lookup Card - for doctor */}
          {isDoctor && (
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
                  transition: 'box-shadow 0.3s, transform 0.3s'
                }}
                onClick={() => navigate('/patient-lookup')}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                    <HospitalIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    Tìm kiếm bệnh nhân
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Tìm kiếm bệnh nhân theo mã
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Queue Management Card - for receptionist */}
          {isReceptionist && (
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
                  transition: 'box-shadow 0.3s, transform 0.3s'
                }}
                onClick={() => navigate('/queue-management')}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                    <PeopleIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    Quản lý hàng đợi
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Quản lý hàng đợi khám bệnh
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Security Card - only for admin and admin_hospital */}
          {isAdmin && (
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
                  transition: 'box-shadow 0.3s, transform 0.3s'
                }}
                onClick={() => window.open('/siem/', '_blank', 'noopener,noreferrer')}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Avatar sx={{ bgcolor: 'info.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                    <SecurityIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    SIEM Dashboard
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Security and Compliance Monitoring
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
}

export default Dashboard;

