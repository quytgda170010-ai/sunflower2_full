import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import api from '../api/axios';

function MyActivity() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  useEffect(() => {
    fetchMyActivity();
  }, [page, rowsPerPage]);

  const fetchMyActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/my-activity', {
        params: {
          page: page + 1, // API uses 1-based pagination
          page_size: rowsPerPage,
        },
        // Use gateway URL instead of direct backend
        baseURL: 'http://localhost:8081',
      });

      setData(response.data);
    } catch (err) {
      console.error('Error fetching activity:', err);
      setError(err.response?.data?.detail || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 400 && status < 500) return 'warning';
    if (status >= 500) return 'error';
    return 'default';
  };

  const getStatusIcon = (status) => {
    if (status >= 200 && status < 300) return <SuccessIcon fontSize="small" />;
    if (status >= 400) return <ErrorIcon fontSize="small" />;
    return <InfoIcon fontSize="small" />;
  };

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Lịch Sử Truy Cập
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Xem tất cả lịch sử truy cập hồ sơ y tế và thông tin cá nhân của bạn
      </Typography>

      {/* Patient Info Card */}
      {data.patient_info && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Thông Tin Bệnh Nhân
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Họ Tên
                </Typography>
                <Typography variant="body1">
                  {data.patient_info.full_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Ngày Sinh
                </Typography>
                <Typography variant="body1">
                  {data.patient_info.date_of_birth || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Điện Thoại
                </Typography>
                <Typography variant="body1">
                  {data.patient_info.phone || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {data.patient_info.email || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Thống Kê Hoạt Động
          </Typography>
          <Typography variant="body1">
            Tổng Số Hoạt Động: <strong>{data.total || 0}</strong>
          </Typography>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Thời Gian</TableCell>
                <TableCell>Hành Động</TableCell>
                <TableCell>Mục Đích</TableCell>
                <TableCell>Hồ Sơ</TableCell>
                <TableCell>Trạng Thái</TableCell>
                <TableCell>Địa Chỉ IP</TableCell>
                <TableCell>Trình Duyệt</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.activities && data.activities.length > 0 ? (
                data.activities.map((activity, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {formatTimestamp(activity.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={activity.method || 'N/A'}
                        size="small"
                        color={activity.method === 'GET' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {activity.purpose || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {activity.record_title ? (
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {activity.record_title}
                          </Typography>
                          {activity.record_type && (
                            <Chip
                              label={activity.record_type}
                              size="small"
                              variant="outlined"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(activity.status)}
                        label={activity.status || 'N/A'}
                        size="small"
                        color={getStatusColor(activity.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {activity.ip_address || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ maxWidth: 200 }}
                        title={activity.user_agent}
                      >
                        {activity.user_agent || 'N/A'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" py={3}>
                      Không có lịch sử hoạt động
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={data.total || 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </Box>
  );
}

export default MyActivity;

