// src/pages/ChatbotManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import type { AlertColor } from '@mui/material';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  AlertTitle,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  // MUI v7 doi Grid sang API moi (size={{xs,lg}}) va bo item/xs/lg.
  // Code nay viet theo API v5/v6 nen tren v7 cac prop do bi BO AM THAM
  // -> moi o xep full-width thay vi chia cot. GridLegacy la ban Grid cu,
  // giu dung layout ma code mong doi.
  // TODO: migrate sang Grid moi: <Grid size={{ xs: 12, lg: 6 }}> khong co item.
  GridLegacy as Grid,
  Stack,
  Avatar,
  LinearProgress,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery,
  Backdrop,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { chatbotAPI } from '../../services/api';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[4],
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

const GradientBox = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(135deg, #1a1a1a 0%, #2d3748 50%, #4a5568 100%)'
    : 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 50%, #e2e8f0 100%)',
  minHeight: '100vh',
}));

const HeaderCard = styled(StyledCard)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#ffffff',
  marginBottom: theme.spacing(4),
}));

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  borderRadius: theme.spacing(1.5),
  background: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.background.paper,
}));

// styled() voi prop RIENG phai khai bao kieu, khong thi MUI coi
// isDragActive la prop cua Box va bao khong ton tai.
const UploadBox = styled(Box, {
  // shouldForwardProp: chan isDragActive di xuong DOM (React se canh bao
  // ve attribute khong hop le neu de no xuong the div).
  shouldForwardProp: (prop) => prop !== 'isDragActive',
})<{ isDragActive?: boolean }>(({ theme, isDragActive }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.grey[300]}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  textAlign: 'center',
  backgroundColor: isDragActive ? theme.palette.action.hover : 'transparent',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

const HiddenInput = styled('input')({
  display: 'none',
});

const ChatbotManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fileInputRef = useRef(null);
  
  // Tab state
  const [tabValue, setTabValue] = useState('0');
  
  // Snackbar state
  // AlertColor thay vi string: Alert.severity chi nhan
  // 'success' | 'info' | 'warning' | 'error'.
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({ open: false, message: '', severity: 'success' });
  
  // Data sources state
  const [dataSources, setDataSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Form states
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [editingFile, setEditingFile] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [deletingFile, setDeletingFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  
  // Upload states
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Chatbot test state
  const [testQuery, setTestQuery] = useState('');
  const [testLanguage, setTestLanguage] = useState('vi');
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  
  // Loading states
  const [rebuildLoading, setRebuildLoading] = useState(false);

  useEffect(() => {
    fetchDataSources();
  }, []);

  const showSnackbar = (message: string, severity: AlertColor = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchDataSources = async () => {
    try {
      setLoadingSources(true);
      const response = await chatbotAPI.getDataSources();
      setDataSources(response.data.data);
    } catch (error) {
      showSnackbar('Không thể tải danh sách tài liệu', 'error');
    } finally {
      setLoadingSources(false);
    }
  };

  // File upload functions
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    setUploadFiles(files);
    if (files.length > 0) {
      setIsUploadOpen(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const textFiles = files.filter(file => 
      file.type === 'text/plain' || 
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.csv')
    );
    
    if (textFiles.length !== files.length) {
      showSnackbar('Chỉ hỗ trợ file văn bản (.txt, .md, .csv)', 'warning');
    }
    
    if (textFiles.length > 0) {
      setUploadFiles(textFiles);
      setIsUploadOpen(true);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    // Promise<string>: khong co type param thi ket qua la unknown va
    // addDataSource(file.name, content) bao sai kieu.
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => // readAsText() luon tra string, nhung kieu cua FileReader.result la
        // string | ArrayBuffer | null. String() de khong phai cast bua.
        resolve(String(e.target?.result ?? ''));
      reader.onerror = (e) => reject(e);
      reader.readAsText(file, 'UTF-8');
    });
  };

  const handleUploadFiles = async () => {
    if (uploadFiles.length === 0) return;

    try {
      setIsUploading(true);
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        try {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { status: 'reading', progress: 0 }
          }));

          // Đọc nội dung file
          const content = await readFileContent(file);
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { status: 'uploading', progress: 50 }
          }));

          // Upload lên server
          await chatbotAPI.addDataSource(file.name, content);
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { status: 'success', progress: 100 }
          }));
          
          successCount++;
        } catch (error) {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { status: 'error', progress: 0, error: error.message }
          }));
          errorCount++;
        }
      }

      // Hiển thị kết quả
      if (successCount > 0 && errorCount === 0) {
        showSnackbar(`✅ Đã tải lên ${successCount} file thành công!`, 'success');
      } else if (successCount > 0 && errorCount > 0) {
        showSnackbar(`⚠️ Tải lên thành công ${successCount} file, ${errorCount} file lỗi`, 'warning');
      } else {
        showSnackbar(`❌ Không thể tải lên file nào`, 'error');
      }

      // Làm mới danh sách
      if (successCount > 0) {
        fetchDataSources();
      }

      // Đóng modal sau 2 giây nếu thành công hoàn toàn
      if (errorCount === 0) {
        setTimeout(() => {
          setIsUploadOpen(false);
          setUploadFiles([]);
          setUploadProgress({});
        }, 2000);
      }

    } catch (error) {
      showSnackbar('Lỗi khi tải lên file', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadFile = (index) => {
    const newFiles = [...uploadFiles];
    const fileName = newFiles[index].name;
    newFiles.splice(index, 1);
    setUploadFiles(newFiles);
    
    // Xóa progress của file
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const getUploadStatusIcon = (status) => {
    switch (status) {
      case 'reading':
        return <CircularProgress size={16} />;
      case 'uploading':
        return <CircularProgress size={16} />;
      case 'success':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'error':
        return <WarningIcon color="error" fontSize="small" />;
      default:
        return <FileIcon fontSize="small" />;
    }
  };

  const handleAddFile = async () => {
    if (!newFileName.trim() || !newFileContent.trim()) {
      showSnackbar('Vui lòng nhập tên file và nội dung', 'error');
      return;
    }

    try {
      await chatbotAPI.addDataSource(newFileName, newFileContent);
      showSnackbar('Đã thêm tài liệu mới');
      setNewFileName('');
      setNewFileContent('');
      setIsAddOpen(false);
      fetchDataSources();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Không thể thêm tài liệu', 'error');
    }
  };

  const handleEditFile = async (filename) => {
    try {
      const response = await chatbotAPI.getFileContent(filename);
      setEditingFile(filename);
      setEditContent(response.data.data.content);
      setIsEditOpen(true);
    } catch (error) {
      showSnackbar('Không thể tải nội dung file', 'error');
    }
  };

  const handlePreviewFile = async (filename) => {
    try {
      const response = await chatbotAPI.getFileContent(filename);
      setPreviewFile({ filename, content: response.data.data.content });
      setIsPreviewOpen(true);
    } catch (error) {
      showSnackbar('Không thể tải nội dung file', 'error');
    }
  };

  const handleUpdateFile = async () => {
    if (!editContent.trim()) {
      showSnackbar('Nội dung không được để trống', 'error');
      return;
    }

    try {
      await chatbotAPI.updateDataSource(editingFile, editContent);
      showSnackbar('Đã cập nhật tài liệu');
      setIsEditOpen(false);
      fetchDataSources();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Không thể cập nhật tài liệu', 'error');
    }
  };

  const handleDeleteFile = async () => {
    try {
      await chatbotAPI.deleteDataSource(deletingFile);
      showSnackbar('Đã xóa tài liệu');
      setIsDeleteOpen(false);
      fetchDataSources();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Không thể xóa tài liệu', 'error');
    }
  };

  const handleTestChatbot = async () => {
    if (!testQuery.trim()) {
      showSnackbar('Vui lòng nhập câu hỏi', 'error');
      return;
    }

    try {
      setTestLoading(true);
      const response = await chatbotAPI.testChatbot(testQuery, testLanguage);
      setTestResult(response.data.data);
    } catch (error) {
      showSnackbar('Không thể test chatbot', 'error');
    } finally {
      setTestLoading(false);
    }
  };

  const handleRebuildVectorstore = async () => {
    try {
      setRebuildLoading(true);
      await chatbotAPI.rebuildVectorstore();
      showSnackbar('Đã rebuild vector store thành công');
    } catch (error) {
      showSnackbar('Không thể rebuild vector store', 'error');
    } finally {
      setRebuildLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'txt':
        return '📄';
      case 'pdf':
        return '📕';
      case 'doc':
      case 'docx':
        return '📘';
      case 'md':
        return '📝';
      case 'csv':
        return '📊';
      default:
        return '📄';
    }
  };

  const filteredDataSources = dataSources.filter(file => 
    file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSize = dataSources.reduce((acc, file) => acc + file.size, 0);

  return (
    <GradientBox>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header Section */}
        <HeaderCard>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md="auto">
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    bgcolor: 'primary.main',
                    fontSize: '2rem'
                  }}
                >
                  🤖
                </Avatar>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  sx={{ 
                    background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold',
                    mb: 1
                  }}
                >
                  🤖 Quản lý Chatbot Du lịch
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Quản lý dữ liệu, test và cấu hình chatbot AI thông minh
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <StatCard>
                      <Typography variant="h6" color="primary">
                        {dataSources.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tài liệu
                      </Typography>
                    </StatCard>
                  </Grid>
                  <Grid item xs={4}>
                    <StatCard>
                      <Typography variant="h6" color="primary">
                        {formatFileSize(totalSize)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Dung lượng
                      </Typography>
                    </StatCard>
                  </Grid>
                  <Grid item xs={4}>
                    <StatCard>
                      <CheckCircleIcon color="success" />
                      <Typography variant="caption" color="text.secondary">
                        Hoạt động
                      </Typography>
                    </StatCard>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </HeaderCard>

        {/* Main Content */}
        <StyledCard>
          <TabContext value={tabValue}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <TabList 
                onChange={(e, newValue) => setTabValue(newValue)} 
                centered
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons="auto"
              >
                <Tab 
                  icon={<InfoIcon />} 
                  label="Quản lý dữ liệu" 
                  value="0"
                  iconPosition="start"
                />
                <Tab 
                  icon={<ChatIcon />} 
                  label="Test Chatbot" 
                  value="1"
                  iconPosition="start"
                />
                <Tab 
                  icon={<SettingsIcon />} 
                  label="Cài đặt hệ thống" 
                  value="2"
                  iconPosition="start"
                />
              </TabList>
            </Box>

            {/* Data Management Tab */}
            <TabPanel value="0" sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* Action Bar */}
                <Stack 
                  direction={{ xs: 'column', md: 'row' }} 
                  spacing={2} 
                  alignItems="center" 
                  justifyContent="space-between"
                >
                  <TextField
                    placeholder="🔍 Tìm kiếm tài liệu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined"
                    size="medium"
                    sx={{ minWidth: 300 }}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                  
                  <Stack direction="row" spacing={2}>
                    <Button 
                      startIcon={<CloudUploadIcon />} 
                      variant="outlined"
                      color="primary"
                      onClick={() => fileInputRef.current?.click()}
                      size="large"
                      sx={{ borderRadius: 2 }}
                    >
                      📤 Tải lên file
                    </Button>
                    <Button 
                      startIcon={<AddIcon />} 
                      variant="contained" 
                      onClick={() => setIsAddOpen(true)}
                      size="large"
                      sx={{ borderRadius: 2 }}
                    >
                      Thêm tài liệu mới
                    </Button>
                  </Stack>
                </Stack>

                {/* Upload Area */}
                <StyledCard sx={{ border: 2, borderStyle: 'dashed', borderColor: 'primary.light' }}>
                  <CardContent>
                    <UploadBox
                      isDragActive={isDragActive}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <CloudUploadIcon 
                        sx={{ 
                          fontSize: 48, 
                          color: isDragActive ? 'primary.main' : 'text.secondary',
                          mb: 2 
                        }} 
                      />
                      <Typography variant="h6" gutterBottom>
                        {isDragActive ? 'Thả file vào đây' : 'Kéo thả file hoặc click để chọn'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hỗ trợ: .txt, .md, .csv (tối đa 10MB mỗi file)
                      </Typography>
                    </UploadBox>
                  </CardContent>
                </StyledCard>

                <HiddenInput
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.md,.csv,text/plain"
                  onChange={handleFileSelect}
                />

                {/* Data Table */}
                <StyledCard>
                  <CardContent sx={{ p: 0 }}>
                    {loadingSources ? (
                      <Box display="flex" justifyContent="center" p={6}>
                        <Stack spacing={2} alignItems="center">
                          <CircularProgress size={60} />
                          <Typography>Đang tải dữ liệu...</Typography>
                        </Stack>
                      </Box>
                    ) : filteredDataSources.length === 0 ? (
                      <Box textAlign="center" p={6}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          {searchTerm ? 'Không tìm thấy tài liệu phù hợp' : 'Chưa có tài liệu nào'}
                        </Typography>
                        <Button 
                          variant="contained" 
                          onClick={() => setIsAddOpen(true)}
                          startIcon={<AddIcon />}
                        >
                          Thêm tài liệu đầu tiên
                        </Button>
                      </Box>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                              <TableCell><Typography fontWeight="bold">Tài liệu</Typography></TableCell>
                              <TableCell><Typography fontWeight="bold">Kích thước</Typography></TableCell>
                              <TableCell><Typography fontWeight="bold">Loại</Typography></TableCell>
                              <TableCell><Typography fontWeight="bold">Cập nhật</Typography></TableCell>
                              <TableCell align="center"><Typography fontWeight="bold">Thao tác</Typography></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredDataSources.map((file, index) => (
                              <TableRow 
                                key={index} 
                                hover
                                sx={{ '&:hover': { bgcolor: 'grey.50' } }}
                              >
                                <TableCell>
                                  <Stack direction="row" spacing={2} alignItems="center">
                                    <Typography variant="h5">{getFileIcon(file.filename)}</Typography>
                                    <Typography fontWeight="medium">{file.filename}</Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Typography fontWeight="medium">{formatFileSize(file.size)}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={file.extension || 'txt'} 
                                    color="primary" 
                                    variant="outlined"
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Stack spacing={0.5}>
                                    <Typography variant="body2">
                                      {new Date(file.modified).toLocaleDateString('vi-VN')}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(file.modified).toLocaleTimeString('vi-VN')}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell align="center">
                                  <Stack direction="row" spacing={1} justifyContent="center">
                                    <Tooltip title="Xem trước">
                                      <IconButton
                                        size="small"
                                        onClick={() => handlePreviewFile(file.filename)}
                                      >
                                        <ViewIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Chỉnh sửa">
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleEditFile(file.filename)}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Xóa">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => {
                                          setDeletingFile(file.filename);
                                          setIsDeleteOpen(true);
                                        }}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </StyledCard>
              </Stack>
            </TabPanel>

            {/* Chatbot Test Tab */}
            <TabPanel value="1" sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* Test Interface */}
                <StyledCard>
                  <CardHeader 
                    avatar={<ChatIcon color="success" />}
                    title="🧪 Test Chatbot"
                  />
                  <CardContent>
                    <Stack spacing={3}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Ngôn ngữ</InputLabel>
                            <Select 
                              value={testLanguage} 
                              onChange={(e) => setTestLanguage(e.target.value)}
                              label="Ngôn ngữ"
                            >
                              <MenuItem value="vi">🇻🇳 Tiếng Việt</MenuItem>
                              <MenuItem value="en">🇺🇸 English</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                      
                      <TextField
                        fullWidth
                        label="Câu hỏi"
                        multiline
                        rows={4}
                        value={testQuery}
                        onChange={(e) => setTestQuery(e.target.value)}
                        placeholder="Ví dụ: Hãy giới thiệu về vịnh Hạ Long..."
                        variant="outlined"
                      />
                      
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleTestChatbot}
                        disabled={testLoading}
                        startIcon={testLoading ? <CircularProgress size={20} /> : null}
                        size="large"
                        sx={{ alignSelf: { xs: 'stretch', md: 'flex-start' } }}
                      >
                        {testLoading ? '🤔 Đang suy nghĩ...' : '🚀 Test Chatbot'}
                      </Button>
                    </Stack>
                  </CardContent>
                </StyledCard>

                {/* Test Results */}
                {testResult && (
                  <StyledCard sx={{ border: 2, borderColor: 'success.light' }}>
                    <CardHeader 
                      avatar={<CheckCircleIcon color="success" />}
                      title="✨ Kết quả Test"
                      titleTypographyProps={{ color: 'success.main' }}
                    />
                    <CardContent>
                      <Stack spacing={3}>
                        {/* Query Info */}
                        <Alert severity="info" variant="outlined">
                          <AlertTitle>📝 THÔNG TIN TRUY VẤN</AlertTitle>
                          <Typography><strong>Câu hỏi:</strong> {testResult.query}</Typography>
                          <Typography><strong>Ngôn ngữ:</strong> {testResult.language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇺🇸 English'}</Typography>
                        </Alert>
                        
                        {/* Answer */}
                        <Alert severity="success" variant="outlined">
                          <AlertTitle>🤖 TRẢ LỜI CỦA CHATBOT</AlertTitle>
                          <Typography 
                            component="pre" 
                            sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}
                          >
                            {testResult.response?.answer || testResult.response}
                          </Typography>
                        </Alert>
                        
                        {/* Sources */}
                        {testResult.response?.sources && (
                          <Alert severity="info" variant="outlined">
                            <AlertTitle>📚 NGUỒN THAM KHẢO</AlertTitle>
                            <Stack spacing={2}>
                              {testResult.response.sources.map((source, index) => (
                                <Paper 
                                  key={index} 
                                  variant="outlined" 
                                  sx={{ p: 2, bgcolor: 'background.default' }}
                                >
                                  <Stack spacing={1}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Typography variant="h6">{getFileIcon(source.source)}</Typography>
                                      <Typography variant="subtitle2" color="primary">
                                        {source.source}
                                      </Typography>
                                    </Stack>
                                    <Typography 
                                      variant="body2" 
                                      color="text.secondary"
                                      sx={{ 
                                        bgcolor: 'grey.100', 
                                        p: 1, 
                                        borderRadius: 1 
                                      }}
                                    >
                                      {source.content}
                                    </Typography>
                                  </Stack>
                                </Paper>
                              ))}
                            </Stack>
                          </Alert>
                        )}
                      </Stack>
                    </CardContent>
                  </StyledCard>
                )}
              </Stack>
            </TabPanel>

            {/* System Settings Tab */}
            <TabPanel value="2" sx={{ p: 3 }}>
              <Stack spacing={3}>
                <StyledCard>
                  <CardHeader 
                    avatar={<RefreshIcon color="warning" />}
                    title="🔧 Cài đặt hệ thống"
                  />
                  <CardContent>
                    <Stack spacing={3}>
                      <Alert severity="info" variant="outlined">
                        <AlertTitle>Rebuild Vector Store</AlertTitle>
                        Tái tạo lại toàn bộ cơ sở dữ liệu vector từ các tài liệu hiện có. 
                        Quá trình này sẽ cập nhật kiến thức cho chatbot.
                      </Alert>
                      
                      <Alert severity="warning" variant="outlined">
                        <AlertTitle>⚠️ Lưu ý quan trọng</AlertTitle>
                        Quá trình này có thể mất vài phút và chatbot sẽ tạm thời không hoạt động trong thời gian rebuild.
                      </Alert>
                      
                      {rebuildLoading && (
                        <Paper sx={{ p: 3, bgcolor: 'primary.light' }}>
                          <Stack spacing={2} alignItems="center">
                            <CircularProgress size={48} />
                            <Typography fontWeight="medium" color="primary">
                              Đang rebuild vector store...
                            </Typography>
                            <LinearProgress 
                              color="primary" 
                              sx={{ width: '100%', borderRadius: 1 }}
                            />
                          </Stack>
                        </Paper>
                      )}
                      
                      <Button
                        startIcon={<RefreshIcon />}
                        variant="contained"
                        color="warning"
                        onClick={handleRebuildVectorstore}
                        disabled={rebuildLoading}
                        size="large"
                        sx={{ alignSelf: { xs: 'stretch', md: 'flex-start' } }}
                      >
                        {rebuildLoading ? '🔄 Đang rebuild...' : '🚀 Rebuild Vector Store'}
                      </Button>
                    </Stack>
                  </CardContent>
                </StyledCard>
              </Stack>
            </TabPanel>
          </TabContext>
        </StyledCard>
      </Container>

      {/* Add File Modal */}
      <Dialog 
        open={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <AddIcon />
            <Typography variant="h6">📄 Thêm tài liệu mới</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Tên file"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Ví dụ: halong_bay.txt"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Nội dung"
              multiline
              rows={12}
              value={newFileContent}
              onChange={(e) => setNewFileContent(e.target.value)}
              placeholder="Nhập nội dung tài liệu về du lịch..."
              variant="outlined"
              helperText="💡 Tip: Nhập thông tin chi tiết về địa điểm, dịch vụ du lịch để chatbot có thể trả lời tốt hơn"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button onClick={() => setIsAddOpen(false)} size="large">
            Hủy
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddFile} 
            size="large"
          >
            ✅ Thêm tài liệu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Files Modal */}
      <Dialog 
        open={isUploadOpen} 
        onClose={() => !isUploading && setIsUploadOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <CloudUploadIcon />
            <Typography variant="h6">📤 Tải lên tài liệu</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Stack spacing={3}>
            <Alert severity="info" variant="outlined">
              <AlertTitle>Danh sách file sẽ tải lên</AlertTitle>
              Tổng cộng: {uploadFiles.length} file
            </Alert>
            
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {uploadFiles.map((file, index) => {
                const progress = uploadProgress[file.name];
                return (
                  <ListItem 
                    key={index}
                    sx={{ 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1, 
                      mb: 1 
                    }}
                  >
                    <ListItemIcon>
                      {getUploadStatusIcon(progress?.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="body1">{file.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({formatFileSize(file.size)})
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={1}>
                          {progress?.status && (
                            <Typography variant="caption" color="text.secondary">
                              {progress.status === 'reading' && 'Đang đọc file...'}
                              {progress.status === 'uploading' && 'Đang tải lên...'}
                              {progress.status === 'success' && '✅ Thành công'}
                              {progress.status === 'error' && `❌ Lỗi: ${progress.error}`}
                            </Typography>
                          )}
                          {progress?.progress > 0 && (
                            <LinearProgress 
                              variant="determinate" 
                              value={progress.progress}
                              sx={{ borderRadius: 1 }}
                            />
                          )}
                        </Stack>
                      }
                    />
                    {!isUploading && !progress && (
                      <IconButton 
                        edge="end" 
                        onClick={() => removeUploadFile(index)}
                        size="small"
                        color="error"
                      >
                        <CloseIcon />
                      </IconButton>
                    )}
                  </ListItem>
                );
              })}
            </List>

            {uploadFiles.length === 0 && (
              <Alert severity="warning">
                Chưa có file nào được chọn
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button 
            onClick={() => setIsUploadOpen(false)}
            disabled={isUploading}
            size="large"
          >
            Hủy
          </Button>
          <Button
            onClick={() => {
              setUploadFiles([]);
              setUploadProgress({});
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            startIcon={<AttachFileIcon />}
            size="large"
          >
            Chọn file khác
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUploadFiles} 
            disabled={uploadFiles.length === 0 || isUploading}
            startIcon={isUploading ? <CircularProgress size={20} /> : <UploadIcon />}
            size="large"
          >
            {isUploading ? 'Đang tải lên...' : `📤 Tải lên ${uploadFiles.length} file`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit File Modal */}
      <Dialog 
        open={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <EditIcon />
            <Typography variant="h6">✏️ Chỉnh sửa: {editingFile}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <TextField
            fullWidth
            label="Nội dung tài liệu"
            multiline
            rows={18}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            variant="outlined"
            sx={{ fontFamily: 'monospace' }}
            helperText={`📊 Độ dài: ${editContent.length} ký tự`}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button onClick={() => setIsEditOpen(false)} size="large">
            Hủy
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateFile} 
            size="large"
          >
            💾 Cập nhật
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview File Modal */}
      <Dialog 
        open={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: 'grey.600', color: 'white' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <ViewIcon />
            <Typography variant="h6">👁️ Xem trước: {previewFile?.filename}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: 'background.default',
              maxHeight: 500,
              overflow: 'auto',
              whiteSpace: 'pre-line',
              fontFamily: 'monospace'
            }}
          >
            {previewFile?.content}
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button 
            variant="contained" 
            startIcon={<CloseIcon />}
            onClick={() => setIsPreviewOpen(false)}
            size="large"
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete File Confirmation */}
      <Dialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <WarningIcon color="error" />
            <Typography variant="h6">Xác nhận xóa</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa tài liệu <strong>{deletingFile}</strong> không? 
            Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Button onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteFile}
          >
            🗑️ Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </GradientBox>
  );
};

export default ChatbotManagement;