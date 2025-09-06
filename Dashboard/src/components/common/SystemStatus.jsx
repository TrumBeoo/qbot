// src/components/common/SystemStatus.jsx
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stack,
  Chip,
  LinearProgress,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Dns as ServerIcon,
  Storage as DatabaseIcon,
  Memory as CpuIcon,
  Computer as HardDriveIcon,
  Wifi as WifiIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const SystemStatus = ({ chatbotStats }) => {
  const theme = useTheme();

  const systemMetrics = [
    {
      label: 'API Server',
      status: 'online',
      icon: ServerIcon,
      value: '99.9%',
      description: 'Uptime'
    },
    {
      label: 'Database',
      status: 'online',
      icon: DatabaseIcon,
      value: '< 50ms',
      description: 'Response time'
    },
    {
      label: 'Vector Store',
      status: 'online',
      icon: CpuIcon,
      value: chatbotStats?.rag_system?.document_count || 0,
      description: 'Documents indexed'
    },
    {
      label: 'Storage',
      status: 'warning',
      icon: HardDriveIcon,
      value: '78%',
      description: 'Used'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'offline': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return CheckCircleIcon;
      case 'warning': return WarningIcon;
      case 'offline': return WarningIcon;
      default: return ServerIcon;
    }
  };

  const getChipColor = (status) => {
    switch (status) {
      case 'online': return 'success';
      case 'warning': return 'warning';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card elevation={1} sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WifiIcon sx={{ color: theme.palette.success.main }} />
            <Typography variant="h6" component="div">
              Trạng thái hệ thống
            </Typography>
            <Chip 
              label="Hoạt động tốt" 
              color="success" 
              size="small"
              variant="outlined"
            />
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <CardContent>
        <Stack spacing={3}>
          {systemMetrics.map((metric, index) => {
            const StatusIcon = getStatusIcon(metric.status);
            const MetricIcon = metric.icon;
            
            return (
              <Box key={index}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MetricIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                    <Typography variant="body2" fontWeight="medium">
                      {metric.label}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {metric.value}
                    </Typography>
                    <StatusIcon 
                      sx={{ 
                        color: getStatusColor(metric.status),
                        fontSize: 18
                      }}
                    />
                  </Box>
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  {metric.description}
                </Typography>
                
                {metric.status === 'warning' && metric.label === 'Storage' && (
                  <LinearProgress 
                    variant="determinate" 
                    value={78} 
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.warning.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.warning.main,
                        borderRadius: 3
                      }
                    }}
                  />
                )}
                
                {index < systemMetrics.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            );
          })}
        </Stack>
        
        <Divider sx={{ my: 3 }} />
        
        <Box>
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            Thông tin phiên bản
          </Typography>
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Dashboard</Typography>
              <Typography variant="caption" fontWeight="medium">v2.1.0</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">API Backend</Typography>
              <Typography variant="caption" fontWeight="medium">v1.5.2</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Last Update</Typography>
              <Typography variant="caption" fontWeight="medium">
                {new Date().toLocaleDateString('vi-VN')}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SystemStatus;