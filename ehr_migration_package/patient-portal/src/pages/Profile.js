import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Cake as CakeIcon,
  Wc as GenderIcon,
} from '@mui/icons-material';
import api from '../api/axios';
import { format } from 'date-fns';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/patient/profile');
      setProfile(response.data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Không thể tải hồ sơ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
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

  if (!profile) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Không có dữ liệu hồ sơ
      </Alert>
    );
  }

  const InfoItem = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box sx={{ mr: 2, color: 'primary.main' }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1">{value || 'N/A'}</Typography>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Thông Tin Cá Nhân
      </Typography>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PersonIcon sx={{ fontSize: 60, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h5">{profile.full_name}</Typography>
              <Chip label={`Patient ID: ${profile.patient_code}`} size="small" sx={{ mt: 1 }} />
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <InfoItem
                icon={<CakeIcon />}
                label="Ngày Sinh"
                value={profile.date_of_birth ? format(new Date(profile.date_of_birth), 'MMM dd, yyyy') : 'N/A'}
              />
              <InfoItem
                icon={<GenderIcon />}
                label="Giới Tính"
                value={profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'N/A'}
              />
              <InfoItem
                icon={<EmailIcon />}
                label="Email"
                value={profile.email}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <InfoItem
                icon={<PhoneIcon />}
                label="Điện Thoại"
                value={profile.phone}
              />
              <InfoItem
                icon={<HomeIcon />}
                label="Địa Chỉ"
                value={profile.address}
              />
            </Grid>
          </Grid>

          {(profile.emergency_contact_name || profile.emergency_contact_phone) && (
            <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                Liên Hệ Khẩn Cấp
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <InfoItem
                    icon={<PersonIcon />}
                    label="Họ Tên"
                    value={profile.emergency_contact_name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoItem
                    icon={<PhoneIcon />}
                    label="Điện Thoại"
                    value={profile.emergency_contact_phone}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Profile;

