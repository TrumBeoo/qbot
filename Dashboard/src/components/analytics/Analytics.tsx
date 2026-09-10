// src/pages/Analytics.jsx
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
  LinearProgress,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Message as MessageIcon,
  People as PeopleIcon,
  Description as DocumentIcon,
  Language as LanguageIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { chatbotAPI } from '../../services/api';

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

const AnalyticsPage = () => {
  const theme = useTheme();
  const [chatbotStats, setChatbotStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchChatbotStats();
  }, []);

  const fetchChatbotStats = async () => {
    try {
      setLoading(true);
      const response = await chatbotAPI.getStats();
      setChatbotStats(response.data.data);
      setError(null);
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  const keyMetrics = [
    {
      title: 'Tổng cuộc trò chuyện',
      value: chatbotStats?.conversations?.total || 0,
      subtitle: `+${chatbotStats?.conversations?.recent_30_days || 0} trong 30 ngày`,
      icon: MessageIcon,
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.1)
    },
    {
      title: 'Tổng tin nhắn',
      value: chatbotStats?.conversations?.total_messages || 0,
      subtitle: `Trung bình ${chatbotStats?.conversations?.total_messages && chatbotStats?.conversations?.total ? 
        Math.round(chatbotStats.conversations.total_messages / chatbotStats.conversations.total) : 0} tin nhắn/cuộc trò chuyện`,
      icon: TrendingUpIcon,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1)
    },
    {
      title: 'Người dùng hoạt động',
      value: chatbotStats?.conversations?.active_users || 0,
      subtitle: 'Đã sử dụng chatbot',
      icon: PeopleIcon,
      color: theme.palette.secondary.main,
      bgColor: alpha(theme.palette.secondary.main, 0.1)
    },
    {
      title: 'Tài liệu trong hệ thống',
      value: chatbotStats?.rag_system?.document_count || 0,
      subtitle: 'Chunks dữ liệu',
      icon: DocumentIcon,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1)
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Báo cáo & Phân tích Chatbot
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Theo dõi hiệu suất và phân tích dữ liệu sử dụng chatbot
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
              fontWeight: 500
            }
          }}
        >
          <Tab label="Tổng quan" />
          <Tab label="Hoạt động hàng ngày" />
          <Tab label="Phân tích ngôn ngữ" />
          <Tab label="Hiệu suất hệ thống" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanelComponent value={tabValue} index={0}>
          {chatbotStats && (
            <Stack spacing={4}>
              {/* Key Metrics */}
              <Grid container spacing={3}>
                {keyMetrics.map((metric, index) => {
                  const IconComponent = metric.icon;
                  return (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Card elevation={1}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {metric.title}
                              </Typography>
                              <Typography variant="h4" component="div" fontWeight="bold">
                                {metric.value}
                              </Typography>
                              <Typography variant="body2" sx={{ color: metric.color, mt: 1 }}>
                                {metric.subtitle}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                backgroundColor: metric.bgColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
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

              {/* Usage Trend */}
              <Card elevation={1}>
                <CardHeader title="Xu hướng sử dụng" />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1">
                      Tỷ lệ sử dụng trong 30 ngày qua
                    </Typography>
                    <Chip
                      label={`${chatbotStats.conversations?.total ? 
                        Math.round((chatbotStats.conversations.recent_30_days / chatbotStats.conversations.total) * 100) : 0}%`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={chatbotStats.conversations?.total ? 
                      (chatbotStats.conversations.recent_30_days / chatbotStats.conversations.total) * 100 : 0}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Stack>
          )}
        </TabPanelComponent>

        {/* Daily Activity Tab */}
        <TabPanelComponent value={tabValue} index={1}>
          {chatbotStats?.daily_stats && (
            <Card elevation={1}>
              <CardHeader 
                title="Hoạt động 7 ngày qua"
                avatar={<TimelineIcon color="primary" />}
              />
              <CardContent>
                <Stack spacing={2}>
                  {chatbotStats.daily_stats.map((day, index) => (
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
                      <Chip
                        label={`${day.conversations} cuộc trò chuyện`}
                        color={day.conversations > 0 ? 'success' : 'default'}
                        size="small"
                      />
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </TabPanelComponent>

        {/* Language Analysis Tab */}
        <TabPanelComponent value={tabValue} index={2}>
          {chatbotStats?.language_distribution && (
            <Card elevation={1}>
              <CardHeader 
                title="Phân bố ngôn ngữ sử dụng"
                avatar={<LanguageIcon color="primary" />}
              />
              <CardContent>
                <Stack spacing={3}>
                  {chatbotStats.language_distribution.map((lang, index) => {
                    const total = chatbotStats.language_distribution.reduce((sum, l) => sum + l.count, 0);
                    const percentage = Math.round((lang.count / total) * 100);
                    
                    return (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {lang._id === 'vi' ? 'Tiếng Việt' : 'English'}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" color="text.secondary">
                              {lang.count} tin nhắn
                            </Typography>
                            <Chip
                              label={`${percentage}%`}
                              color={lang._id === 'vi' ? 'primary' : 'success'}
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
                              lang._id === 'vi' ? theme.palette.primary.main : theme.palette.success.main, 
                              0.1
                            ),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: lang._id === 'vi' ? theme.palette.primary.main : theme.palette.success.main
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
        </TabPanelComponent>

        {/* System Performance Tab */}
        <TabPanelComponent value={tabValue} index={3}>
          {chatbotStats?.rag_system && (
            <Stack spacing={3}>
              <Card elevation={1}>
                <CardHeader 
                  title="Thông tin hệ thống RAG"
                  avatar={<SpeedIcon color="primary" />}
                />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          LLM Model
                        </Typography>
                        <Chip
                          label={chatbotStats.rag_system.llm_model || 'N/A'}
                          color="secondary"
                          variant="outlined"
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Embedding Model
                        </Typography>
                        <Chip
                          label={chatbotStats.rag_system.embedding_model?.split('/').pop() || 'N/A'}
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.success.main, 0.05), borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Chunk Size
                        </Typography>
                        <Chip
                          label={chatbotStats.rag_system.chunk_size || 'N/A'}
                          color="success"
                          variant="outlined"
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.warning.main, 0.05), borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Chunk Overlap
                        </Typography>
                        <Chip
                          label={chatbotStats.rag_system.chunk_overlap || 'N/A'}
                          color="warning"
                          variant="outlined"
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card elevation={1}>
                <CardHeader 
                  title="Trạng thái cập nhật"
                  avatar={<StorageIcon color="primary" />}
                />
                <CardContent>
                  <Stack spacing={2}>
                    {chatbotStats.rag_system.last_build_time && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" fontWeight="medium">
                          Cập nhật cuối:
                        </Typography>
                        <Chip
                          label={new Date(chatbotStats.rag_system.last_build_time * 1000).toLocaleString('vi-VN')}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    )}
                    
                    <Divider />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" fontWeight="medium">
                        Số lượng documents:
                      </Typography>
                      <Chip
                        label={`${chatbotStats.rag_system.document_count || 0} chunks`}
                        color="primary"
                        size="small"
                      />
                    </Box>
                    
                    <Divider />
                    
                    <Box>
                      <Typography variant="body1" fontWeight="medium" gutterBottom>
                        Thư mục dữ liệu:
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {chatbotStats.rag_system.data_directory || 'N/A'}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          )}
        </TabPanelComponent>
      </Paper>
    </Container>
  );
};

export default AnalyticsPage;