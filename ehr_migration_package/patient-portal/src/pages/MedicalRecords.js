import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Pagination,
  Grid,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import api from '../api/axios';
import { format } from 'date-fns';

function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchRecords();
  }, [page]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/patient/medical-records?page=${page}&page_size=${pageSize}`);
      setRecords(response.data.records || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (err) {
      console.error('Failed to fetch medical records:', err);
      setError('Không thể tải hồ sơ bệnh án. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const getSensitivityColor = (level) => {
    switch (level) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Hồ Sơ Bệnh Án
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Xem lịch sử khám bệnh và hồ sơ y tế (Chỉ đọc)
      </Typography>

      {records.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Không có hồ sơ bệnh án
        </Alert>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {records.map((record) => (
              <Grid item xs={12} key={record.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">{record.title}</Typography>
                      </Box>
                      <Box>
                        <Chip
                          label={record.record_type}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                        {record.sensitivity_level && (
                          <Chip
                            label={record.sensitivity_level.toUpperCase()}
                            size="small"
                            color={getSensitivityColor(record.sensitivity_level)}
                          />
                        )}
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" paragraph>
                      {record.content}
                    </Typography>

                    {record.diagnosis_code && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Mã Chẩn Đoán:</strong> {record.diagnosis_code}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Ngày tạo: {record.created_at ? format(new Date(record.created_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                      </Typography>
                      {record.created_by && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                          Bởi: {record.created_by}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

export default MedicalRecords;

