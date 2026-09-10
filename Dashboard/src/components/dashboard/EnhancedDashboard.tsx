// src/components/dashboard/EnhancedDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  // MUI v7 doi Grid sang API moi (size={{xs,lg}}) va bo item/xs/lg.
  // Code nay viet theo API v5/v6 nen tren v7 cac prop do bi BO AM THAM
  // -> moi o xep full-width thay vi chia cot. GridLegacy la ban Grid cu,
  // giu dung layout ma code mong doi.
  // TODO: migrate sang Grid moi: <Grid size={{ xs: 12, lg: 6 }}> khong co item.
  GridLegacy as Grid,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  Stack,
  IconButton,
  Paper,
  Avatar,
  useTheme,
  alpha,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Language as LanguageIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, chatbotAPI } from '../../services/api';

const EnhancedDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [comprehensiveData, setComprehensiveData] = useState(null);
  const [ragStats, setRagStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [userRes, comprehensiveRes, ragRes] = await Promise.all([
        dashboardAPI.getUserAnalytics(),
        dashboardAPI.getComprehensiveAnalytics(),
        chatbotAPI.getStats()
      ]);

      setUserAnalytics(userRes.data.data);
      setComprehensiveData(comprehensiveRes.data.data);
      setRagStats(ragRes.data.data);
      setLastUpdated(new Date());

    } catch (err) {
      setError('Không thể tải dữ liệu dashboard');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="400px">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Đang tải dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Calculate user statistics
  const userStats = userAnalytics?.user_stats || {};
  const systemStats = comprehensiveData?.overview || {};

  // Key metrics for user
  const userMetrics = [
    {
      title: 'Cuộc trò chuyện của bạn',
      value: userStats.total_conversations || 0,
      subtitle: `+${userStats.recent_conversations || 0} trong 30 ngày`,
      icon: PersonIcon,
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.1),
      trend: userStats.recent_conversations > 0 ? 'Tăng' : 'Ổn định'
    },
    {
      title: 'Tin nhắn của bạn',
      value: userStats.total_messages || 0,
      subtitle: `Trung bình ${userStats.avg_messages_per_conversation || 0}/cuộc trò chuyện`,
      icon: ChatIcon,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1),
      trend: 'Hoạt động'
    },
    {
      title: 'Tổng người dùng',
      value: systemStats.active_users || 0,
      subtitle: 'Đang sử dụng hệ thống',
      icon: PeopleIcon,
      color: theme.palette.secondary.main,
      bgColor: alpha(theme.palette.secondary.main, 0.1),
      trend: 'Tăng trưởng'
    },
    {
      title: 'Tổng cuộc trò chuyện',
      value: systemStats.total_conversations || 0,
      subtitle: `+${systemStats.recent_conversations || 0} gần đây`,
      icon: MessageIcon,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1),
      trend: 'Tích cực'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              👋 Chào mừng, {user?.name || 'User'}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Dashboard cá nhân với dữ liệu thời gian thực từ hệ thống chatbot
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Cập nhật lần cuối: {lastUpdated.toLocaleString('vi-VN')}
            </Typography>
          </Box>
          <Tooltip title="Làm mới dữ liệu">
            <IconButton onClick={fetchDashboardData} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {error && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={fetchDashboardData}>
                Thử lại
              </Button>
            }
          >
            {error}
          </Alert>
        )}
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {userMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                elevation={1}
                sx={{
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {metric.title}
                      </Typography>
                      <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 1 }}>
                        {metric.value.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: metric.color, mb: 0.5 }}>
                        {metric.subtitle}
                      </Typography>
                      <Chip
                        label={metric.trend}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Box>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        backgroundColor: metric.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ml: 2
                      }}
                    >
                      <IconComponent sx={{ color: metric.color, fontSize: 28 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Personal Activity Overview */}
        <Grid item xs={12} md={8}>
          <Card elevation={1}>
            <CardHeader 
              title="📊 Tổng quan hoạt động cá nhân"
              action={
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/analytics')}
                  startIcon={<AnalyticsIcon />}
                >
                  Xem chi tiết
                </Button>
              }
            />
            <CardContent>
              <Grid container spacing={3}>
                {/* User vs System Comparison */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      So sánh với hệ thống
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Tỷ lệ cuộc trò chuyện</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {Math.round(((userStats.total_conversations || 0) / (systemStats.total_conversations || 1)) * 100)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(((userStats.total_conversations || 0) / (systemStats.total_conversations || 1)) * 100, 100)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Tỷ lệ tin nhắn</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {Math.round(((userStats.total_messages || 0) / (systemStats.total_messages || 1)) * 100)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(((userStats.total_messages || 0) / (systemStats.total_messages || 1)) * 100, 100)}
                          color="secondary"
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Stack>
                  </Box>
                </Grid>

                {/* Recent Activity */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Hoạt động gần đây
                    </Typography>
                    <Stack spacing={2}>
                      {userAnalytics?.daily_activity?.slice(0, 3).map((day, index) => (
                        <Paper
                          key={index}
                          elevation={0}
                          sx={{
                            p: 2,
                            backgroundColor: alpha(theme.palette.primary.main, 0.02),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight="medium">
                              {new Date(day.date).toLocaleDateString('vi-VN', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <Chip
                                label={`${day.conversations} cuộc trò chuyện`}
                                size="small"
                                color={day.conversations > 0 ? 'primary' : 'default'}
                              />
                            </Stack>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions & System Info */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Language Usage */}
            {userAnalytics?.language_usage && userAnalytics.language_usage.length > 0 && (
              <Card elevation={1}>
                <CardHeader 
                  title="🌐 Ngôn ngữ sử dụng"
                  avatar={<LanguageIcon color="primary" />}
                />
                <CardContent>
                  <Stack spacing={2}>
                    {userAnalytics.language_usage.map((lang, index) => {
                      const total = userAnalytics.language_usage.reduce((sum, l) => sum + l.count, 0);
                      const percentage = Math.round((lang.count / total) * 100);
                      
                      return (
                        <Box key={index}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {lang.language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇺🇸 English'}
                            </Typography>
                            <Chip
                              label={`${percentage}%`}
                              size="small"
                              color={lang.language === 'vi' ? 'primary' : 'success'}
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: alpha(
                                lang.language === 'vi' ? theme.palette.primary.main : theme.palette.success.main, 
                                0.1
                              ),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                backgroundColor: lang.language === 'vi' ? theme.palette.primary.main : theme.palette.success.main
                              }
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card elevation={1}>
              <CardHeader title="⚡ Hành động nhanh" />
              <CardContent>
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AnalyticsIcon />}
                    onClick={() => navigate('/analytics')}
                  >
                    Xem báo cáo chi tiết
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<TimelineIcon />}
                    onClick={() => navigate('/analytics')}
                  >
                    Phân tích xu hướng
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card elevation={1}>
              <CardHeader title="🔧 Trạng thái hệ thống" />
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Tổng tài liệu</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {ragStats?.rag_system?.document_count || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Model AI</Typography>
                    <Typography variant="body2" fontWeight="bold" color="secondary.main">
                      {ragStats?.rag_system?.llm_model || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Trạng thái</Typography>
                    <Chip
                      label="Hoạt động"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedDashboard;