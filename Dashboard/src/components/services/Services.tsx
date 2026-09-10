// src/pages/Services.jsx
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  // MUI v7 doi Grid sang API moi (size={{xs,lg}}) va bo item/xs/lg.
  // Code nay viet theo API v5/v6 nen tren v7 cac prop do bi BO AM THAM
  // -> moi o xep full-width thay vi chia cot. GridLegacy la ban Grid cu,
  // giu dung layout ma code mong doi.
  // TODO: migrate sang Grid moi: <Grid size={{ xs: 12, lg: 6 }}> khong co item.
  GridLegacy as Grid,
  Paper,
  Button,
  IconButton,
  Chip,
  Stack,
  Alert,
  Avatar,
  useTheme,
  alpha,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Chat as ChatIcon,
  Language as LanguageIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Storage as StorageIcon,
  Api as ApiIcon,
  Notifications as NotificationsIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useState } from 'react';

const ServicesPage = () => {
  const theme = useTheme();
  
  const [services, setServices] = useState({
    chatbot: true,
    languageDetection: true,
    voiceRecognition: false,
    analytics: true,
    dataBackup: true,
    apiAccess: true,
    notifications: true,
    autoUpdate: false
  });

  const handleServiceToggle = (serviceName) => {
    setServices(prev => ({
      ...prev,
      [serviceName]: !prev[serviceName]
    }));
  };

  const servicesList = [
    {
      id: 'chatbot',
      name: 'Chatbot Core',
      description: 'Dịch vụ chatbot chính với AI và RAG system',
      icon: ChatIcon,
      status: services.chatbot,
      color: theme.palette.primary.main,
      features: ['AI Response', 'Context Understanding', 'Multi-language Support'],
      critical: true
    },
    {
      id: 'languageDetection',
      name: 'Language Detection',
      description: 'Tự động nhận diện ngôn ngữ trong cuộc trò chuyện',
      icon: LanguageIcon,
      status: services.languageDetection,
      color: theme.palette.secondary.main,
      features: ['Vietnamese Detection', 'English Detection', 'Auto Switch'],
      critical: false
    },
    {
      id: 'voiceRecognition',
      name: 'Voice Recognition',
      description: 'Nhận diện giọng nói và chuyển đổi thành text',
      icon: SpeedIcon,
      status: services.voiceRecognition,
      color: theme.palette.warning.main,
      features: ['Speech to Text', 'Voice Commands', 'Audio Processing'],
      critical: false
    },
    {
      id: 'analytics',
      name: 'Analytics & Reporting',
      description: 'Thu thập và phân tích dữ liệu sử dụng',
      icon: AnalyticsIcon,
      status: services.analytics,
      color: theme.palette.success.main,
      features: ['Usage Statistics', 'Performance Metrics', 'Custom Reports'],
      critical: false
    },
    {
      id: 'dataBackup',
      name: 'Data Backup',
      description: 'Sao lưu tự động dữ liệu và cấu hình',
      icon: StorageIcon,
      status: services.dataBackup,
      color: theme.palette.info.main,
      features: ['Auto Backup', 'Cloud Storage', 'Data Recovery'],
      critical: true
    },
    {
      id: 'apiAccess',
      name: 'API Access',
      description: 'Truy cập API cho tích hợp bên ngoài',
      icon: ApiIcon,
      status: services.apiAccess,
      color: theme.palette.primary.main,
      features: ['REST API', 'Webhook Support', 'Rate Limiting'],
      critical: false
    },
    {
      id: 'notifications',
      name: 'Notifications',
      description: 'Thông báo về trạng thái hệ thống và cảnh báo',
      icon: NotificationsIcon,
      status: services.notifications,
      color: theme.palette.secondary.main,
      features: ['Email Alerts', 'System Status', 'Error Notifications'],
      critical: false
    },
    {
      id: 'autoUpdate',
      name: 'Auto Update',
      description: 'Cập nhật tự động hệ thống và tính năng mới',
      icon: CloudUploadIcon,
      status: services.autoUpdate,
      color: theme.palette.warning.main,
      features: ['System Updates', 'Feature Updates', 'Security Patches'],
      critical: false
    }
  ];

  const systemHealth = {
    overall: 'healthy',
    uptime: '99.9%',
    responseTime: '< 200ms',
    activeServices: Object.values(services).filter(Boolean).length,
    totalServices: Object.keys(services).length
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'healthy': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'critical': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getHealthIcon = (health) => {
    switch (health) {
      case 'healthy': return CheckCircleIcon;
      case 'warning': return WarningIcon;
      case 'critical': return WarningIcon;
      default: return InfoIcon;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Dịch vụ hệ thống
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý và cấu hình các dịch vụ của hệ thống chatbot
        </Typography>
      </Box>

      {/* System Health Overview */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Tổng quan hệ thống
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: alpha(getHealthColor(systemHealth.overall), 0.1),
                  mb: 1
                }}
              >
                {(() => {
                  const HealthIcon = getHealthIcon(systemHealth.overall);
                  return <HealthIcon sx={{ color: getHealthColor(systemHealth.overall), fontSize: 30 }} />;
                })()}
              </Box>
              <Typography variant="h6" fontWeight="bold" color={getHealthColor(systemHealth.overall)}>
                Hệ thống khỏe mạnh
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tất cả dịch vụ hoạt động bình thường
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {systemHealth.uptime}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uptime
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {systemHealth.responseTime}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Response Time
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="secondary.main">
                    {systemHealth.activeServices}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dịch vụ hoạt động
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="text.primary">
                    {systemHealth.totalServices}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng dịch vụ
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Services Grid */}
      <Grid container spacing={3}>
        {servicesList.map((service) => {
          const ServiceIcon = service.icon;
          
          return (
            <Grid item xs={12} md={6} key={service.id}>
              <Card 
                elevation={1}
                sx={{
                  height: '100%',
                  border: service.critical ? `2px solid ${alpha(theme.palette.warning.main, 0.3)}` : 'none',
                  position: 'relative'
                }}
              >
                {service.critical && (
                  <Chip
                    label="Critical"
                    color="warning"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 1
                    }}
                  />
                )}
                
                <CardHeader
                  avatar={
                    <Avatar
                      sx={{
                        bgcolor: alpha(service.color, 0.1),
                        color: service.color
                      }}
                    >
                      <ServiceIcon />
                    </Avatar>
                  }
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight="bold">
                        {service.name}
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={service.status}
                            onChange={() => handleServiceToggle(service.id)}
                            color="primary"
                          />
                        }
                        label=""
                        sx={{ m: 0 }}
                      />
                    </Box>
                  }
                  subheader={service.description}
                />
                
                <CardContent sx={{ pt: 0 }}>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={service.status ? 'Đang hoạt động' : 'Tạm dừng'}
                      color={service.status ? 'success' : 'default'}
                      size="small"
                      icon={service.status ? <CheckCircleIcon /> : <WarningIcon />}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tính năng:
                  </Typography>
                  
                  <List dense sx={{ py: 0 }}>
                    {service.features.map((feature, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 20 }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: service.color }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Service Configuration */}
      <Paper elevation={1} sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Cấu hình nâng cao
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Một số dịch vụ có thể yêu cầu khởi động lại hệ thống để áp dụng thay đổi.
        </Alert>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Bảo mật
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Cấu hình bảo mật và quyền truy cập
                </Typography>
                <Button variant="outlined" size="small" disabled>
                  Cấu hình
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Tùy chỉnh
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tùy chỉnh giao diện và hành vi hệ thống
                </Typography>
                <Button variant="outlined" size="small" disabled>
                  Tùy chỉnh
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Service Logs */}
      <Paper elevation={1} sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Nhật ký hoạt động gần đây
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Chatbot Core đã khởi động thành công"
              secondary="2 phút trước"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="info" />
            </ListItemIcon>
            <ListItemText
              primary="Analytics service đã cập nhật dữ liệu"
              secondary="15 phút trước"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Data Backup hoàn thành"
              secondary="1 giờ trước"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Voice Recognition service tạm dừng"
              secondary="2 giờ trước"
            />
          </ListItem>
        </List>
      </Paper>
    </Container>
  );
};

export default ServicesPage;