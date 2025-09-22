// src/components/analytics/RealTimeAnalytics.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Paper,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
  alpha,
  Button,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Message as MessageIcon,
  People as PeopleIcon,
  Description as DocumentIcon,
  Language as LanguageIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  AccessTime as AccessTimeIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { dashboardAPI, chatbotAPI } from '../../services/api';
import AdvancedCharts from './AdvancedCharts';

function TabPanelComponent(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const RealTimeAnalytics = () => {
  const theme = useTheme();
  const [comprehensiveData, setComprehensiveData] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [conversationInsights, setConversationInsights] = useState(null);
  const [ragStats, setRagStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all analytics data in parallel
      const [comprehensiveRes, userRes, insightsRes, ragRes] = await Promise.all([
        dashboardAPI.getComprehensiveAnalytics(),
        dashboardAPI.getUserAnalytics(),
        dashboardAPI.getConversationInsights(),
        chatbotAPI.getStats()
      ]);

      setComprehensiveData(comprehensiveRes.data.data);
      setUserAnalytics(userRes.data.data);
      setConversationInsights(insightsRes.data.data);
      setRagStats(ragRes.data.data);
      setLastUpdated(new Date());

    } catch (err) {
      setError('Không thể tải dữ liệu phân tích');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleExportData = () => {
    const dataToExport = {
      comprehensive: comprehensiveData,
      user: userAnalytics,
      insights: conversationInsights,
      rag: ragStats,
      exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="400px">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Đang tải dữ liệu phân tích...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Key metrics for overview
  const keyMetrics = [
    {
      title: 'Cuộc trò chuyện của bạn',
      value: userAnalytics?.user_stats?.total_conversations || 0,
      subtitle: `+${userAnalytics?.user_stats?.recent_conversations || 0} trong 30 ngày`,
      icon: PersonIcon,
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.1),
      trend: userAnalytics?.user_stats?.recent_conversations > 0 ? '+' + Math.round((userAnalytics.user_stats.recent_conversations / userAnalytics.user_stats.total_conversations) * 100) + '%' : '0%'
    },
    {
      title: 'Tin nhắn của bạn',
      value: userAnalytics?.user_stats?.total_messages || 0,
      subtitle: `Trung bình ${userAnalytics?.user_stats?.avg_messages_per_conversation || 0} tin nhắn/cuộc trò chuyện`,
      icon: ChatIcon,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1),
      trend: '+' + Math.round(((userAnalytics?.user_stats?.total_messages || 0) / (comprehensiveData?.overview?.total_messages || 1)) * 100) + '%'
    },
    {
      title: 'Tổng người dùng hệ thống',
      value: comprehensiveData?.overview?.active_users || 0,
      subtitle: 'Đã sử dụng chatbot',
      icon: PeopleIcon,
      color: theme.palette.secondary.main,
      bgColor: alpha(theme.palette.secondary.main, 0.1),
      trend: '+' + Math.round(((comprehensiveData?.overview?.recent_conversations || 0) / (comprehensiveData?.overview?.total_conversations || 1)) * 100) + '%'
    },
    {
      title: 'Tài liệu hệ thống',
      value: ragStats?.rag_system?.document_count || 0,
      subtitle: 'Chunks dữ liệu',
      icon: DocumentIcon,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1),
      trend: 'Stable'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              📊 Báo cáo Phân tích Thời gian Thực
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Theo dõi hoạt động cá nhân và hệ thống với dữ liệu thật từ database
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Cập nhật lần cuối: {lastUpdated.toLocaleString('vi-VN')}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Làm mới dữ liệu">
              <IconButton onClick={fetchAllAnalytics} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Xuất báo cáo">
              <IconButton onClick={handleExportData} size="small">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Chia sẻ">
              <IconButton size="small">
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {error && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={fetchAllAnalytics}>
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
        {keyMetrics.map((metric, index) => {
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

      {/* Tabs */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 48
            }
          }}
        >
          <Tab label="📈 Tổng quan" />
          <Tab label="📊 Biểu đồ phân tích" />
          <Tab label="👤 Hoạt động cá nhân" />
          <Tab label="🔍 Phân tích chi tiết" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanelComponent value={tabValue} index={0}>
          <Stack spacing={4}>
            {/* System vs User Comparison */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardHeader 
                    title="So sánh với hệ thống"
                    avatar={<AnalyticsIcon color="primary" />}
                  />
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Tỷ lệ cuộc trò chuyện của bạn</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {Math.round(((userAnalytics?.user_stats?.total_conversations || 0) / (comprehensiveData?.overview?.total_conversations || 1)) * 100)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(((userAnalytics?.user_stats?.total_conversations || 0) / (comprehensiveData?.overview?.total_conversations || 1)) * 100, 100)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Tỷ lệ tin nhắn của bạn</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {Math.round(((userAnalytics?.user_stats?.total_messages || 0) / (comprehensiveData?.overview?.total_messages || 1)) * 100)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(((userAnalytics?.user_stats?.total_messages || 0) / (comprehensiveData?.overview?.total_messages || 1)) * 100, 100)}
                          color="secondary"
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardHeader 
                    title="Thống kê nhanh"
                    avatar={<SpeedIcon color="primary" />}
                  />
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Tổng cuộc trò chuyện hệ thống</Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          {comprehensiveData?.overview?.total_conversations?.toLocaleString() || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Tổng tin nhắn hệ thống</Typography>
                        <Typography variant="body2" fontWeight="bold" color="secondary.main">
                          {comprehensiveData?.overview?.total_messages?.toLocaleString() || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Trung bình tin nhắn/cuộc trò chuyện</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {comprehensiveData?.overview?.avg_messages_per_conversation || 0}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Language Usage */}
            {userAnalytics?.language_usage && userAnalytics.language_usage.length > 0 && (
              <Card elevation={1}>
                <CardHeader 
                  title="Sử dụng ngôn ngữ của bạn"
                  avatar={<LanguageIcon color="primary" />}
                />
                <CardContent>
                  <Grid container spacing={2}>
                    {userAnalytics.language_usage.map((lang, index) => {
                      const total = userAnalytics.language_usage.reduce((sum, l) => sum + l.count, 0);
                      const percentage = Math.round((lang.count / total) * 100);
                      
                      return (
                        <Grid item xs={12} sm={6} key={index}>
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body1" fontWeight="medium">
                                {lang.language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇺🇸 English'}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" color="text.secondary">
                                  {lang.count} tin nhắn
                                </Typography>
                                <Chip
                                  label={`${percentage}%`}
                                  color={lang.language === 'vi' ? 'primary' : 'success'}
                                  size="small"
                                />
                              </Stack>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={percentage}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: alpha(
                                  lang.language === 'vi' ? theme.palette.primary.main : theme.palette.success.main, 
                                  0.1
                                ),
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 4,
                                  backgroundColor: lang.language === 'vi' ? theme.palette.primary.main : theme.palette.success.main
                                }
                              }}
                            />
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Stack>
        </TabPanelComponent>

        {/* Charts Tab */}
        <TabPanelComponent value={tabValue} index={1}>
          {comprehensiveData && (
            <AdvancedCharts analyticsData={comprehensiveData} />
          )}
        </TabPanelComponent>

        {/* Personal Activity Tab */}
        <TabPanelComponent value={tabValue} index={2}>
          {userAnalytics?.daily_activity && (
            <Card elevation={1}>
              <CardHeader 
                title="Hoạt động cá nhân 7 ngày qua"
                avatar={<TimelineIcon color="primary" />}
              />
              <CardContent>
                <Stack spacing={2}>
                  {userAnalytics.daily_activity.map((day, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="body1" fontWeight="medium">
                        {new Date(day.date).toLocaleDateString('vi-VN', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          label={`${day.conversations} cuộc trò chuyện`}
                          color={day.conversations > 0 ? 'primary' : 'default'}
                          size="small"
                        />
                        <Chip
                          label={`${day.messages} tin nhắn`}
                          color={day.messages > 0 ? 'success' : 'default'}
                          size="small"
                        />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </TabPanelComponent>

        {/* Detailed Analysis Tab */}
        <TabPanelComponent value={tabValue} index={3}>
          {conversationInsights && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardHeader 
                    title="Phân tích cuộc trò chuyện của bạn"
                    avatar={<PersonIcon color="primary" />}
                  />
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Trung bình tin nhắn/cuộc trò chuyện</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {conversationInsights.user_insights?.conversation_length?.avg_messages || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Thời gian trò chuyện trung bình</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {conversationInsights.user_insights?.conversation_duration?.avg_duration_minutes || 0} phút
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Cuộc trò chuyện dài nhất</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {conversationInsights.user_insights?.conversation_length?.max_messages || 0} tin nhắn
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardHeader 
                    title="So sánh với hệ thống"
                    avatar={<AnalyticsIcon color="secondary" />}
                  />
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Hệ thống - Trung bình tin nhắn</Typography>
                        <Typography variant="body2" fontWeight="bold" color="secondary.main">
                          {conversationInsights.system_insights?.conversation_length?.avg_messages || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Hệ thống - Thời gian trung bình</Typography>
                        <Typography variant="body2" fontWeight="bold" color="secondary.main">
                          {conversationInsights.system_insights?.conversation_duration?.avg_duration_minutes || 0} phút
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Hệ thống - Cuộc trò chuyện dài nhất</Typography>
                        <Typography variant="body2" fontWeight="bold" color="secondary.main">
                          {conversationInsights.system_insights?.conversation_length?.max_messages || 0} tin nhắn
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Activity by Time Period */}
              {conversationInsights.user_insights?.activity_by_time && (
                <Grid item xs={12}>
                  <Card elevation={1}>
                    <CardHeader 
                      title="Hoạt động theo khung giờ"
                      avatar={<AccessTimeIcon color="primary" />}
                    />
                    <CardContent>
                      <Grid container spacing={2}>
                        {conversationInsights.user_insights.activity_by_time.map((period, index) => (
                          <Grid item xs={12} sm={6} md={3} key={index}>
                            <Box
                              sx={{
                                p: 2,
                                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                borderRadius: 2,
                                textAlign: 'center'
                              }}
                            >
                              <Typography variant="h6" fontWeight="bold" color="primary.main">
                                {period.message_count}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {period.time_period === 'Morning' ? '🌅 Sáng' :
                                 period.time_period === 'Afternoon' ? '☀️ Chiều' :
                                 period.time_period === 'Evening' ? '🌆 Tối' : '🌙 Đêm'}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </TabPanelComponent>
      </Paper>
    </Container>
  );
};

export default RealTimeAnalytics;