import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Alert,
  IconButton,
  Tooltip as MuiTooltip,
  Switch,
  FormControlLabel,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  CheckCircle as SuccessIcon,
  Block as DeniedIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import MetricCard from '../components/MetricCard';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [watchdogAlerts, setWatchdogAlerts] = useState([]);
  const [alertsCount, setAlertsCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    fetchWatchdogAlerts();
  }, []);

  // Auto-refresh every 1 second
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData();
      fetchWatchdogAlerts();
    }, 5000); // Alerts every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, chartRes] = await Promise.all([
        api.get('/api/stats?hours=24'),
        api.get('/api/chart?hours=24'),
      ]);

      setStats(statsRes.data);
      setChartData(chartRes.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchdogAlerts = async () => {
    try {
      const res = await api.get('/api/watchdog-alerts?page_size=10&acknowledged=false');
      setWatchdogAlerts(res.data.alerts || []);
      setAlertsCount(res.data.unacknowledged_count || 0);
    } catch (err) {
      console.error('Failed to fetch watchdog alerts:', err);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await api.post(`/api/watchdog-alerts/${alertId}/acknowledge`, {
        acknowledged_by: 'admin'
      });
      fetchWatchdogAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleManualRefresh = () => {
    fetchDashboardData();
    fetchWatchdogAlerts();
  };

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Security Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Real-time security monitoring and access analytics
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Current time: {format(currentTime, 'yyyy-MM-dd HH:mm:ss')}
            {lastUpdate && (
              <> • Last updated: {format(lastUpdate, 'HH:mm:ss')}</>
            )}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge badgeContent={alertsCount} color="error">
            <SecurityIcon color={alertsCount > 0 ? "error" : "action"} />
          </Badge>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="Auto-refresh"
          />
          <MuiTooltip title="Refresh now">
            <IconButton
              onClick={handleManualRefresh}
              color="primary"
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </MuiTooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Watchdog Alerts - Critical Security Warnings */}
      {alertsCount > 0 && (
        <Card sx={{ mb: 3, border: '2px solid #d32f2f', backgroundColor: '#fff5f5' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WarningIcon sx={{ color: '#d32f2f', mr: 1, fontSize: 28 }} />
              <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                ⚠️ VI PHẠM TÍNH TOÀN VẸN HỆ THỐNG ({alertsCount})
              </Typography>
            </Box>

            {/* Legal Compliance Warning */}
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                📋 TRẠNG THÁI TUÂN THỦ PHÁP LÝ
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Vi phạm:</strong> Chức năng ghi nhật ký đã bị vô hiệu hóa. Rủi ro cao về che giấu vi phạm.
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Quy định liên quan:</strong>
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                <li>
                  <Typography variant="body2">
                    <strong>Luật Khám bệnh, chữa bệnh (sửa đổi):</strong> Yêu cầu truy xuất nguồn gốc thao tác trên hồ sơ bệnh án
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân:</strong> Yêu cầu lưu trữ lịch sử xử lý dữ liệu để phục vụ thanh tra
                  </Typography>
                </li>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                ⚖️ MỨC PHẠT: Phạt tiền từ 50.000.000đ đến 100.000.000đ (Điều 102, Nghị định 15/2020/NĐ-CP)
              </Typography>
            </Alert>

            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Hệ thống đã tự động: Bật lại log, ngắt kết nối nghi ngờ, gửi email cảnh báo
            </Typography>
            <List dense>
              {watchdogAlerts.slice(0, 5).map((alert) => (
                <React.Fragment key={alert.id}>
                  <ListItem
                    secondaryAction={
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                      >
                        Xác nhận
                      </Button>
                    }
                  >
                    <ListItemIcon>
                      <WarningIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Chip label={alert.status} color="error" size="small" />
                          {alert.ip_address && (
                            <Chip
                              label={`🌐 IP: ${alert.ip_address}`}
                              size="small"
                              sx={{
                                bgcolor: '#fff3e0',
                                color: '#e65100',
                                fontFamily: 'monospace',
                                fontWeight: 'bold'
                              }}
                            />
                          )}
                          <Typography variant="body2">{alert.message}</Typography>
                        </Box>
                      }
                      secondary={`Detected: ${alert.detected_at}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Logs (24h)"
            value={stats?.total_logs}
            icon={<AssessmentIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Successful Requests"
            value={stats?.successful_requests}
            icon={<SuccessIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Denied Requests"
            value={stats?.denied_requests}
            icon={<DeniedIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Users"
            value={stats?.active_users}
            icon={<PeopleIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Access Trends Chart */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Access Trends (Last 24 Hours)
          </Typography>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="successful"
                  stroke="#2e7d32"
                  name="Successful"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="denied"
                  stroke="#d32f2f"
                  name="Denied"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">
                No data available for the selected time range
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default Dashboard;


