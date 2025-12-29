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

function HospitalReports() {
  const [reportType, setReportType] = useState('overview');
  const [period, setPeriod] = useState('this_month');
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [reportType, period]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/hospital-reports/${reportType}`, {
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
        `/admin/hospital-reports/${reportType}/export`,
        {
          params: { period, format },
          responseType: 'blob',
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hospital-report-${reportType}-${period}.${format}`);
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
            Hospital Reports
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
                    <MenuItem value="overview">Overview</MenuItem>
                    <MenuItem value="patients">Patient Statistics</MenuItem>
                    <MenuItem value="doctors">Doctor Statistics</MenuItem>
                    <MenuItem value="departments">Department Statistics</MenuItem>
                    <MenuItem value="revenue">Revenue Statistics</MenuItem>
                    <MenuItem value="medications">Medication Usage Statistics</MenuItem>
                    <MenuItem value="lab">Lab Test Statistics</MenuItem>
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
                    <MenuItem value="this_year">This Year</MenuItem>
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

              {reports.summary && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {Object.entries(reports.summary).map(([key, value]) => (
                    <Grid item xs={12} sm={4} key={key}>
                      <Card>
                        <CardContent>
                          <Typography color="textSecondary">{key}</Typography>
                          <Typography variant="h5">{value}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              {reports.details && (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {reports.columns?.map((col) => (
                          <TableCell key={col}>{col}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.details.map((row, index) => (
                        <TableRow key={index}>
                          {reports.columns?.map((col) => (
                            <TableCell key={col}>{row[col] || 'N/A'}</TableCell>
                          ))}
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

export default HospitalReports;

