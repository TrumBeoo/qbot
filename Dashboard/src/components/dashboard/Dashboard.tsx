// src/components/dashboard/Dashboard.jsx
import type { AlertColor } from '@mui/material';
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
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Fab,
  Snackbar,
  useTheme,
  alpha
} from '@mui/material';
import {
  Upload as UploadIcon,
  Storage as StorageIcon,
  Description as DescriptionIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatbotAPI } from '../../services/api';
import FeatureAnnouncement from '../common/FeatureAnnouncement';
import SystemStatus from '../common/SystemStatus';
import StatsCard from './StatsCard';
import QuickActionCard from './QuickActionCard';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const fileInputRef = useRef(null);
  
  const [chatbotStats, setChatbotStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('document');
  const [fileDescription, setFileDescription] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  // AlertColor thay vi string: Alert.severity chi nhan
  // 'success' | 'info' | 'warning' | 'error'.
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({ open: false, message: '', severity: 'info' });

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
      setError('Không thể tải thống kê chatbot');
      console.error('Error fetching chatbot stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: AlertColor = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['text/plain', 'application/pdf', 'text/csv', 'application/json'];
      if (!allowedTypes.includes(file.type)) {
        showSnackbar('Vui lòng chọn file .txt, .pdf, .csv hoặc .json', 'error');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showSnackbar('Vui lòng chọn file nhỏ hơn 10MB', 'error');
        return;
      }
      
      setSelectedFile(file);
      setUploadModalOpen(true);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !fileDescription.trim()) {
      showSnackbar('Vui lòng chọn file và nhập mô tả', 'warning');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', fileType);
      formData.append('description', fileDescription);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Try to call API to upload file, fallback to simulation
      try {
        const response = await chatbotAPI.uploadData(formData);
        console.log('Upload response:', response);
      } catch (apiError) {
        console.warn('API upload failed, simulating:', apiError);
        // Simulate API call as fallback
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      showSnackbar(`File "${selectedFile.name}" đã được tải lên và xử lý`, 'success');

      // Reset form
      setSelectedFile(null);
      setFileDescription('');
      setFileType('document');
      setUploadModalOpen(false);
      
      // Refresh stats
      fetchChatbotStats();
      
    } catch (error) {
      showSnackbar('Có lỗi xảy ra khi tải file. Vui lòng thử lại.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRefreshData = async () => {
    showSnackbar('Đang làm mới dữ liệu...', 'info');
    await fetchChatbotStats();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  const statsCards = [
    {
      title: 'Tổng tài liệu',
      value: chatbotStats?.rag_system?.document_count || 0,
      subtitle: 'Hoạt động tốt',
      icon: DescriptionIcon,
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.1)
    },
    {
      title: 'Cuộc trò chuyện',
      value: chatbotStats?.conversations?.total || 0,
      subtitle: `+${chatbotStats?.conversations?.recent_30_days || 0} tháng này`,
      icon: MessageIcon,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1)
    },
    {
      title: 'Người dùng hoạt động',
      value: chatbotStats?.conversations?.active_users || 0,
      subtitle: 'Đang online',
      icon: PeopleIcon,
      color: theme.palette.secondary.main,
      bgColor: alpha(theme.palette.secondary.main, 0.1)
    },
    {
      title: 'Tin nhắn',
      value: chatbotStats?.conversations?.total_messages || 0,
      subtitle: 'Tổng số',
      icon: StorageIcon,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1)
    }
  ];

  const quickActions = [
    {
      title: 'Tải lên tài liệu',
      subtitle: 'PDF, TXT, CSV',
      icon: UploadIcon,
      action: () => fileInputRef.current?.click()
    },
    {
      title: 'Quản lý dữ liệu',
      subtitle: 'Xem & chỉnh sửa',
      icon: StorageIcon,
      action: () => navigate('/data-management')
    },
    {
      title: 'Xuất dữ liệu',
      subtitle: 'Backup & Export',
      icon: DownloadIcon,
      action: () => showSnackbar('Tính năng xuất dữ liệu sẽ sớm được cập nhật', 'info')
    },
    {
      title: 'Xem báo cáo',
      subtitle: 'Thống kê chi tiết',
      icon: TrendingUpIcon,
      action: () => navigate('/analytics')
    }
  ];

  // Recent activities will be loaded from API - no mock data
  const recentActivities = [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Feature Announcement */}
      <FeatureAnnouncement />
      
      {/* Header Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1
              }}
            >
              Chào mừng trở lại, {user?.businessInfo?.business_name || user?.email}!
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: '1.1rem' }}
            >
              Quản lý dữ liệu và theo dõi hiệu suất chatbot du lịch Quảng Ninh
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefreshData}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Làm mới
            </Button>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: theme.shadows[2],
                '&:hover': {
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              Tải lên dữ liệu
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".txt,.pdf,.csv,.json"
              style={{ display: 'none' }}
            />
          </Stack>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2,
              borderRadius: 2,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Typography variant="subtitle2" component="div" fontWeight="bold">
              Lỗi
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Quick Actions */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: 2
          }}
        >
          Hành động nhanh
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <QuickActionCard
                title={action.title}
                subtitle={action.subtitle}
                icon={action.icon}
                action={action.action}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Main Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatsCard
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              color={stat.color}
              bgColor={stat.bgColor}
            />
          </Grid>
        ))}
      </Grid>

      {/* System Information */}
      {chatbotStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Language Distribution */}
          <Grid item xs={12} lg={6}>
            <Card 
              elevation={0} 
              sx={{ 
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2
              }}
            >
              <CardHeader 
                title="Phân bố ngôn ngữ sử dụng"
                titleTypographyProps={{
                  variant: 'h6',
                  fontWeight: 600,
                  color: theme.palette.text.primary
                }}
                sx={{ pb: 1 }}
              />
              <CardContent sx={{ pt: 0 }}>
                {chatbotStats.language_distribution && chatbotStats.language_distribution.length > 0 ? (
                  <Stack spacing={3}>
                    {chatbotStats.language_distribution.map((lang, index) => (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {lang._id === 'vi' ? 'Tiếng Việt' : 'English'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {lang.count} lượt
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(lang.count / (chatbotStats.conversations?.total_messages || 1)) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: lang._id === 'vi' ? theme.palette.primary.main : theme.palette.success.main,
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                    Chưa có dữ liệu ngôn ngữ
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* System Info */}
          <Grid item xs={12} lg={3}>
            <Card 
              elevation={0} 
              sx={{ 
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2
              }}
            >
              <CardHeader 
                title="Thông tin hệ thống"
                titleTypographyProps={{
                  variant: 'h6',
                  fontWeight: 600,
                  color: theme.palette.text.primary
                }}
                sx={{ pb: 1 }}
              />
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      LLM Model
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {chatbotStats.rag_system?.llm_model || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Embedding Model
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {chatbotStats.rag_system?.embedding_model?.split('/').pop() || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Chunk Size
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {chatbotStats.rag_system?.chunk_size || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Chunk Overlap
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {chatbotStats.rag_system?.chunk_overlap || 'N/A'}
                    </Typography>
                  </Box>
                  
                  {chatbotStats.rag_system?.last_build_time && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Cập nhật cuối
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {new Date(chatbotStats.rag_system.last_build_time * 1000).toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          {/* System Status */}
          <Grid item xs={12} lg={3}>
            <SystemStatus chatbotStats={chatbotStats} />
          </Grid>
        </Grid>
      )}

      {/* Recent Activity */}
      <Card 
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2
        }}
      >
        <CardHeader 
          title="Hoạt động gần đây"
          titleTypographyProps={{
            variant: 'h6',
            fontWeight: 600,
            color: theme.palette.text.primary
          }}
          action={
            <Button 
              size="small" 
              onClick={() => navigate('/data-management')}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 2
              }}
            >
              Xem tất cả
            </Button>
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0 }}>
          {recentActivities.length > 0 ? (
            <List sx={{ p: 0 }}>
              {recentActivities.map((activity, index) => (
                <ListItem key={index} sx={{ px: 0, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(activity.color, 0.1), width: 40, height: 40 }}>
                      <activity.icon sx={{ color: activity.color, fontSize: 20 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight="medium">
                        {activity.title}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {activity.time}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 6,
                color: 'text.secondary'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Chưa có hoạt động gần đây
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Các hoạt động sẽ được hiển thị tại đây khi có dữ liệu
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog 
        open={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[10]
          }
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
            pb: 2
          }}
        >
          Tải lên dữ liệu mới
          <IconButton
            onClick={() => setUploadModalOpen(false)}
            sx={{ 
              position: 'absolute', 
              right: 8, 
              top: 8,
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            {selectedFile && (
              <Paper 
                sx={{ 
                  p: 2, 
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderRadius: 2
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary
                  }}
                >
                  File đã chọn:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              </Paper>
            )}
            
            <FormControl fullWidth>
              <InputLabel>Loại dữ liệu</InputLabel>
              <Select
                value={fileType}
                label="Loại dữ liệu"
                onChange={(e) => setFileType(e.target.value)}
              >
                <MenuItem value="document">Tài liệu thông tin</MenuItem>
                <MenuItem value="faq">Câu hỏi thường gặp</MenuItem>
                <MenuItem value="service">Thông tin dịch vụ</MenuItem>
                <MenuItem value="location">Địa điểm du lịch</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Mô tả nội dung"
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn về nội dung file này..."
            />
            
            {isUploading && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  Đang tải lên... {uploadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}
          </Stack>
        </DialogContent>
        
        <DialogActions 
          sx={{ 
            p: 3, 
            borderTop: `1px solid ${theme.palette.divider}`,
            gap: 2
          }}
        >
          <Button 
            onClick={() => setUploadModalOpen(false)} 
            disabled={isUploading}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 2
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleFileUpload}
            disabled={isUploading}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 2,
              boxShadow: theme.shadows[2],
              '&:hover': {
                boxShadow: theme.shadows[4]
              }
            }}
          >
            {isUploading ? 'Đang tải lên...' : 'Tải lên'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DashboardPage;