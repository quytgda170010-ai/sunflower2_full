import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
} from '@mui/material';
import api from '../services/api';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function ScheduleApproval() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/admin/nursing-schedules/pending');
      setSchedules(response.data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (schedule) => {
    try {
      await api.put(`/admin/nursing-schedules/${schedule.id}/approve`);
      setOpenDialog(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error approving schedule:', error);
      alert('Error approving schedule');
    }
  };

  const handleViewDetails = (schedule) => {
    setSelectedSchedule(schedule);
    setOpenDialog(true);
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CalendarTodayIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Nursing Schedule Approval
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nurse</TableCell>
                    <TableCell>Shift Date</TableCell>
                    <TableCell>Shift Type</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No schedules pending approval
                      </TableCell>
                    </TableRow>
                  ) : (
                    schedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>{schedule.nurse_name || 'N/A'}</TableCell>
                        <TableCell>
                          {schedule.shift_date
                            ? new Date(schedule.shift_date).toLocaleDateString('en-US')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{schedule.shift_type || 'N/A'}</TableCell>
                        <TableCell>{schedule.department || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={schedule.status === 'pending' ? 'Pending' : schedule.status}
                            color={schedule.status === 'pending' ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ mr: 1 }}
                            onClick={() => handleViewDetails(schedule)}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleApprove(schedule)}
                          >
                            Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Details</DialogTitle>
        <DialogContent>
          {selectedSchedule && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Nurse: {selectedSchedule.nurse_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Date: {selectedSchedule.shift_date ? new Date(selectedSchedule.shift_date).toLocaleDateString('en-US') : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Shift: {selectedSchedule.shift_type || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Department: {selectedSchedule.department || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          <Button
            onClick={() => handleApprove(selectedSchedule)}
            variant="contained"
            color="primary"
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ScheduleApproval;

