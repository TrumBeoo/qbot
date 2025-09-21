// src/components/analytics/AnalyticsWithCharts.jsx
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
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Message as MessageIcon,
  People as PeopleIcon,
  Description as DocumentIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { chatbotAPI, dashboardAPI } from '../../services/api';

// Import chart components
import {
  ConversationTrendChart,
  MessageVolumeChart,
  DocumentTypeChart,
  LanguageDistributionChart,
  PerformanceChart,
  HourlyActivityChart
} from './Charts';

// Import table components
import { ConversationReportsTable, DocumentAnalyticsTable } from './ReportsTable';

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

// Function to convert real data to analytics format
const convertRealDataToStats = (realData) => {
  const overview = realData.overview || {};
  const locations = realData.locations || [];
  const tourismTypes = realData.tourism_types || {};
  const hotelAnalysis = realData.hotel_analysis || {};
  const popularDestinations = realData.popular_destinations || [];
  const accommodationStats = realData.accommodation_stats || {};

  return {
    conversations: {
      total: overview.total_locations || 0,
      recent_30_days: Math.floor((overview.total_locations || 0) * 0.3),
      total_messages: overview.total_hotels || 0,
      active_users: Object.keys(tourismTypes).length || 0
    },
    daily_stats: generateDailyStats(overview.total_locations || 0),
    language_distribution: [
      { _id: 'vi', count: overview.total_locations || 0, name: 'Địa điểm du lịch' },
      { _id: 'en', count: overview.total_hotels || 0, name: 'Khách sạn' }
    ],
    document_types: Object.entries(tourismTypes).map(([type, count]) => ({
      _id: type,
      count: count,
      name: type
    })),
    performance_metrics: {
      avg_response_time: 1.2,
      success_rate: 98.5,
      user_satisfaction: 4.7
    },
    hourly_activity: generateHourlyActivity(),
    popular_queries: popularDestinations.slice(0, 5).map(dest => ({
      query: dest.name,
      count: dest.mentions,
      percentage: (dest.mentions / popularDestinations.length * 100).toFixed(1)
    })),
    location_stats: {
      total_locations: overview.total_locations || 0,
      location_types: locations.reduce((acc, loc) => {
        acc[loc.type] = (acc[loc.type] || 0) + 1;
        return acc;
      }, {}),
      popular_destinations: popularDestinations
    },
    hotel_stats: {
      total_hotels: overview.total_hotels || 0,
      price_analysis: hotelAnalysis,
      accommodation_breakdown: accommodationStats.by_category || {}
    }
  };
};

// Generate mock daily stats based on total
const generateDailyStats = (total) => {
  const days = 7;
  const avgPerDay = Math.floor(total / 30); // Assume 30 days of data
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString().split('T')[0],
      conversations: Math.floor(avgPerDay * (0.8 + Math.random() * 0.4))
    };
  });
};

// Generate hourly activity pattern
const generateHourlyActivity = () => {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour: hour.toString().padStart(2, '0') + ':00',
    messages: Math.floor(Math.random() * 100) + 20,
    users: Math.floor(Math.random() * 30) + 5
  }));
};

const AnalyticsWithCharts = () => {
  const theme = useTheme();
  const [chatbotStats, setChatbotStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchChatbotStats();
  }, []);

  const fetchChatbotStats = async () => {
    try {
      setLoading(true);
      
      // Thử lấy dữ liệu thật trước
      try {
        const realDataResponse = await dashboardAPI.getRealAnalyticsData();
        if (realDataResponse.data.status === 'success') {
          const realData = realDataResponse.data.data;
          
          // Chuyển đổi dữ liệu thật thành format phù hợp
          const convertedStats = convertRealDataToStats(realData);
          setChatbotStats(convertedStats);
          setError(null);
          setLastUpdated(new Date());
          setLoading(false);
          return;
        }
      } catch (realDataError) {
        console.log('Real data not available, trying chatbot API:', realDataError);
      }
      
      // Fallback to chatbot API
      const response = await chatbotAPI.getStats();
      setChatbotStats(response.data.data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Không thể tải dữ liệu phân tích');
      console.error('Error fetching analytics:', err);
      
      // Fallback to mock data for development
      setChatbotStats({
        conversations: {
          total: 1250,
          recent_30_days: 340,
          total_messages: 4800,
          active_users: 89
        },
        daily_stats: [
          { date: '2024-01-09', conversations: 43 },
          { date: '2024-01-10', conversations: 48 },
          { date: '2024-01-11', conversations: 35 },
          { date: '2024-01-12', conversations: 41 },
          { date: '2024-01-13', conversations: 52 },
          { date: '2024-01-14', conversations: 38 },
          { date: '2024-01-15', conversations: 45 }
        ],
        language_distribution: [
          { _id: 'vi', count: 3200, name: 'Tiếng Việt' },
          { _id: 'en', count: 1600, name: 'English' }
        ],
        rag_system: {
          document_count: 156,
          llm_model: 'gpt-3.5-turbo',
          embedding_model: 'text-embedding-ada-002',
          chunk_size: 1000,
          chunk_overlap: 200,
          last_build_time: Date.now() / 1000,
          data_directory: '/data/documents'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleExportData = () => {
    console.log('Exporting analytics data...');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  // Prepare chart data
  const conversationTrendData = chatbotStats?.daily_stats?.map(day => ({
    date: new Date(day.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    conversations: day.conversations
  })) || [];

  const messageVolumeData = chatbotStats?.daily_stats?.map(day => ({
    date: new Date(day.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    messages: day.conversations * 4 // Estimate messages per conversation
  })) || [];

  const documentTypeData = [
    { type: 'Location', count: 25 },
    { type: 'FAQ', count: 18 },
    { type: 'Service', count: 32 },
    { type: 'Document', count: 15 }
  ];

  const languageData = chatbotStats?.language_distribution?.map(lang => ({
    name: lang._id === 'vi' ? 'Tiếng Việt' : 'English',
    count: lang.count
  })) || [];

  const performanceData = [
    { time: '00:00', responseTime: 1200, accuracy: 94 },
    { time: '04:00', responseTime: 1100, accuracy: 95 },
    { time: '08:00', responseTime: 1400, accuracy: 92 },
    { time: '12:00', responseTime: 1600, accuracy: 90 },
    { time: '16:00', responseTime: 1300, accuracy: 93 },
    { time: '20:00', responseTime: 1250, accuracy: 94 }
  ];

  const hourlyActivityData = [
    { hour: '0h', activity: 5 },
    { hour: '4h', activity: 2 },
    { hour: '8h', activity: 25 },
    { hour: '12h', activity: 45 },
    { hour: '16h', activity: 38 },
    { hour: '20h', activity: 22 }
  ];

  const keyMetrics = [
    {
      title: 'Tổng cuộc trò chuyện',
      value: chatbotStats?.conversations?.total || 0,
      subtitle: `+${chatbotStats?.conversations?.recent_30_days || 0} trong 30 ngày`,
      icon: MessageIcon,
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.1),
      trend: '+12%'
    },
    {
      title: 'Tổng tin nhắn',
      value: chatbotStats?.conversations?.total_messages || 0,
      subtitle: `Trung bình ${chatbotStats?.conversations?.total_messages && chatbotStats?.conversations?.total ? 
        Math.round(chatbotStats.conversations.total_messages / chatbotStats.conversations.total) : 0} tin nhắn/cuộc trò chuyện`,
      icon: TrendingUpIcon,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1),
      trend: '+8%'
    },
    {
      title: 'Người dùng hoạt động',
      value: chatbotStats?.conversations?.active_users || 0,
      subtitle: 'Đã sử dụng chatbot',
      icon: PeopleIcon,
      color: theme.palette.secondary.main,
      bgColor: alpha(theme.palette.secondary.main, 0.1),
      trend: '+15%'
    },
    {
      title: 'Tài liệu trong hệ thống',
      value: chatbotStats?.rag_system?.document_count || 0,
      subtitle: 'Chunks dữ liệu',
      icon: DocumentIcon,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1),
      trend: '+5%'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Báo cáo & Phân tích Chatbot
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Theo dõi hiệu suất và phân tích dữ liệu sử dụng chatbot với biểu đồ trực quan
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Cập nhật lần cuối: {lastUpdated.toLocaleString('vi-VN')}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Làm mới dữ liệu">
              <IconButton onClick={fetchChatbotStats} size="small">
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
              <Button color="inherit" size="small" onClick={fetchChatbotStats}>
                Thử lại
              </Button>
            }
          >
            {error} - Đang hiển thị dữ liệu mẫu
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
          <Tab label="Biểu đồ tổng quan" />
          <Tab label="Phân tích chi tiết" />
          <Tab label="Báo cáo cuộc trò chuyện" />
          <Tab label="Phân tích tài liệu" />
        </Tabs>

        {/* Charts Overview Tab */}
        <TabPanelComponent value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ConversationTrendChart data={conversationTrendData} />
            </Grid>
            <Grid item xs={12} md={6}>
              <MessageVolumeChart data={messageVolumeData} />
            </Grid>
            <Grid item xs={12} md={6}>
              <DocumentTypeChart data={documentTypeData} />
            </Grid>
            <Grid item xs={12} md={6}>
              <LanguageDistributionChart data={languageData} />
            </Grid>
          </Grid>
        </TabPanelComponent>

        {/* Detailed Analysis Tab */}
        <TabPanelComponent value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <PerformanceChart data={performanceData} />
            </Grid>
            <Grid item xs={12} md={6}>
              <HourlyActivityChart data={hourlyActivityData} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardHeader title="Thống kê nhanh" />
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Tỷ lệ phản hồi thành công</Typography>
                      <Chip label="94%" color="success" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Thời gian phản hồi trung bình</Typography>
                      <Typography variant="body2" fontWeight="bold">1.2s</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Độ hài lòng người dùng</Typography>
                      <Chip label="4.6/5" color="success" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Tỷ lệ hoàn thành cuộc trò chuyện</Typography>
                      <Chip label="87%" color="primary" size="small" />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanelComponent>

        {/* Conversation Reports Tab */}
        <TabPanelComponent value={tabValue} index={2}>
          <ConversationReportsTable />
        </TabPanelComponent>

        {/* Document Analytics Tab */}
        <TabPanelComponent value={tabValue} index={3}>
          <DocumentAnalyticsTable />
        </TabPanelComponent>
      </Paper>
    </Container>
  );
};

export default AnalyticsWithCharts;