import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
} from '@mui/material';
import {
  Person as PersonIcon,
  Description as DescriptionIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';

function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Trang Chủ
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Chào mừng đến cổng thông tin bệnh nhân. Tại đây bạn có thể xem thông tin và hồ sơ y tế của mình.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Thông Tin Cá Nhân</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Xem và quản lý thông tin cá nhân của bạn
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DescriptionIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Hồ Sơ Bệnh Án</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Xem lịch sử khám bệnh và hồ sơ y tế
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HospitalIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Sức Khỏe Tổng Quát</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Xem tóm tắt sức khỏe và chỉ số sinh hiệu
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Thông Tin Quan Trọng
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Tất cả hồ sơ bệnh án chỉ được xem, không chỉnh sửa được
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Liên hệ bác sĩ điều trị nếu bạn phát hiện sai sót
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Dữ liệu của bạn được bảo vệ và mã hóa
        </Typography>
      </Paper>
    </Box>
  );
}

export default Dashboard;

