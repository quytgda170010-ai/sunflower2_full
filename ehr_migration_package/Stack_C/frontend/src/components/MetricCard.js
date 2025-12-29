import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

function MetricCard({ title, value, icon, color = 'primary' }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value?.toLocaleString() || 0}
            </Typography>
          </Box>
          <Box
            sx={{
              color: `${color}.main`,
              fontSize: 40,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default MetricCard;

