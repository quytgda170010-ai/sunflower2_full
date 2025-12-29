import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import api from '../services/api';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DownloadIcon from '@mui/icons-material/Download';

function FinancialReports() {
  const [reportType, setReportType] = useState('daily');
  const [period, setPeriod] = useState('today');
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [reportType, period]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/financial-reports/${reportType}`, {
        params: { period },
      });
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await api.get(
        `/admin/financial-reports/${reportType}/export`,
        {
          params: { period, format },
          responseType: 'blob',
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial-report-${reportType}-${period}.${format}`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error exporting report');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AssessmentIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Financial Reports
          </Typography>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    label="Report Type"
                  >
                    <MenuItem value="daily">Daily Revenue</MenuItem>
                    <MenuItem value="monthly">Monthly Revenue</MenuItem>
                    <MenuItem value="debt">Debt</MenuItem>
                    <MenuItem value="income-expense">Income & Expense</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Report Period</InputLabel>
                  <Select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    label="Report Period"
                  >
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="this_week">This Week</MenuItem>
                    <MenuItem value="this_month">This Month</MenuItem>
                    <MenuItem value="last_month">Last Month</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {reports && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Report Results</Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('xlsx')}
                    sx={{ mr: 1 }}
                  >
                    Export Excel
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('pdf')}
                  >
                    Export PDF
                  </Button>
                </Box>
              </Box>

              {reportType === 'daily' && reports.daily_stats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary">Total Revenue</Typography>
                        <Typography variant="h5">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(reports.daily_stats.total_revenue || 0)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary">Number of Bills</Typography>
                        <Typography variant="h5">{reports.daily_stats.total_invoices || 0}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary">Average per Bill</Typography>
                        <Typography variant="h5">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(reports.daily_stats.avg_per_invoice || 0)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {reports.details && (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Revenue</TableCell>
                        <TableCell>Number of Bills</TableCell>
                        <TableCell>Payment Method</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.details.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.date || 'N/A'}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(item.revenue || 0)}
                          </TableCell>
                          <TableCell>{item.invoice_count || 0}</TableCell>
                          <TableCell>{item.payment_method || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
}

export default FinancialReports;

