import React, { useState, useEffect } from 'react';
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  CircularProgress,
  Chip,
  TextField,
  Button,
  TablePagination,
} from '@mui/material';
import api from '../services/api';

function AccessLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ role: '', status: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/logs', {
        params: {
          ...filter,
          page: page + 1,  // Backend uses 1-based indexing
          page_size: rowsPerPage
        }
      });
      setLogs(res.data.logs);
      setTotalCount(res.data.pagination.total);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
  };

  const handleApplyFilter = () => {
    setPage(0);  // Reset to first page when filtering
    fetchLogs();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    if (status === 200) return 'success';
    if (status === 403) return 'error';
    if (status === 401) return 'warning';
    return 'default';
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
      <Typography variant="h4" component="h1" gutterBottom>
        Access Logs
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="Role"
          name="role"
          value={filter.role}
          onChange={handleFilterChange}
          size="small"
        />
        <TextField
          label="Status"
          name="status"
          value={filter.status}
          onChange={handleFilterChange}
          size="small"
        />
        <Button variant="contained" onClick={handleApplyFilter}>
          Filter
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>URI</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Purpose</TableCell>
              <TableCell>IP Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log, idx) => {
              const date = new Date(log.timestamp);
              const vietnamTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
              const formatted = vietnamTime.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              return (
              <TableRow key={idx}>
                <TableCell>{formatted}</TableCell>
                <TableCell>{log.user_id}</TableCell>
                <TableCell>{log.role}</TableCell>
                <TableCell>{log.method}</TableCell>
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.uri}
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.status}
                    color={getStatusColor(log.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{log.purpose}</TableCell>
                <TableCell>{log.ip_address}</TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />
      </TableContainer>
    </Container>
  );
}

export default AccessLogs;

