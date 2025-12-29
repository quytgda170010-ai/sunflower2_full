import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert
} from '@mui/material';
import { API_BASE_URL } from '../services/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WarningIcon from '@mui/icons-material/Warning';
import { useKeycloak } from '../context/KeycloakContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function Reports() {
  const { keycloak } = useKeycloak();
  const [overview, setOverview] = useState({});
  const [patientsByDept, setPatientsByDept] = useState([]);
  const [revenueByMonth, setRevenueByMonth] = useState([]);
  const [topMedications, setTopMedications] = useState([]);
  const [accessLogsSummary, setAccessLogsSummary] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOverviewStats();
    fetchPatientsByDepartment();
    fetchRevenueByMonth(selectedYear);
    fetchTopMedications();
    fetchAccessLogsSummary();
  }, [selectedYear]);

  const fetchOverviewStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/statistics/overview`, {
        headers: { 'Authorization': `Bearer ${keycloak.token}` }
      });
      const data = await response.json();
      setOverview(data);
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      setError('Unable to load overview statistics');
    }
  };

  const fetchPatientsByDepartment = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/statistics/patients-by-department`, {
        headers: { 'Authorization': `Bearer ${keycloak.token}` }
      });
      const result = await response.json();
      setPatientsByDept(result.data || []);
    } catch (error) {
      console.error('Error fetching patients by department:', error);
    }
  };

  const fetchRevenueByMonth = async (year) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/statistics/revenue-by-month?year=${year}`, {
        headers: { 'Authorization': `Bearer ${keycloak.token}` }
      });
      const result = await response.json();
      setRevenueByMonth(result.data || []);
    } catch (error) {
      console.error('Error fetching revenue by month:', error);
    }
  };

  const fetchTopMedications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/statistics/top-medications?limit=10`, {
        headers: { 'Authorization': `Bearer ${keycloak.token}` }
      });
      const result = await response.json();
      setTopMedications(result.data || []);
    } catch (error) {
      console.error('Error fetching top medications:', error);
    }
  };

  const fetchAccessLogsSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/statistics/access-logs-summary?days=30`, {
        headers: { 'Authorization': `Bearer ${keycloak.token}` }
      });
      const data = await response.json();
      setAccessLogsSummary(data);
    } catch (error) {
      console.error('Error fetching access logs summary:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%', bgcolor: color + '10' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ color: color, fontWeight: 'bold' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: color, fontSize: 40 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Reports & Statistics</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Overview Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Patients"
            value={overview.total_patients || 0}
            icon={<PeopleIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Departments"
            value={overview.total_departments || 0}
            icon={<LocalHospitalIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bills"
            value={overview.total_bills || 0}
            icon={<ReceiptIcon />}
            color="#ed6c02"
            subtitle={`Unpaid: ${overview.unpaid_bills || 0}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenue"
            value={formatCurrency(overview.total_revenue || 0)}
            icon={<AttachMoneyIcon />}
            color="#9c27b0"
            subtitle={`Outstanding: ${formatCurrency(overview.outstanding_amount || 0)}`}
          />
        </Grid>
      </Grid>

      {/* Medication Alerts */}
      {(overview.low_stock_medications > 0 || overview.expired_medications > 0) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {overview.low_stock_medications > 0 && (
            <Grid item xs={12} sm={6}>
              <Alert severity="warning" icon={<WarningIcon />}>
                <strong>{overview.low_stock_medications}</strong> medications running low (stock &lt; 10)
              </Alert>
            </Grid>
          )}
          {overview.expired_medications > 0 && (
            <Grid item xs={12} sm={6}>
              <Alert severity="error" icon={<WarningIcon />}>
                <strong>{overview.expired_medications}</strong> medications expired
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Patients by Department */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Patients by Department</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={patientsByDept}
                  dataKey="patient_count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {patientsByDept.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Revenue by Month */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Revenue by Month</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label="Year"
                >
                  {[2023, 2024, 2025, 2026].map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Medications */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Top 10 Most Used Medications</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topMedications} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="medication_name" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_quantity" fill="#82ca9d" name="Total Quantity" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Access Logs Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              System Access (Last 30 Days)
            </Typography>
            <Typography variant="h4" sx={{ mb: 2, color: '#1976d2' }}>
              {accessLogsSummary.total_accesses || 0} accesses
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={accessLogsSummary.by_role || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="access_count" fill="#8884d8" name="Access Count" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Reports;

