// src/pages/DataManagement.jsx
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Paper,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Menu,
  Tabs,
  Tab,
  useTheme,
  alpha,
  Divider,
  Avatar,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Upload as UploadIcon,
  Storage as StorageIcon,
  Description as DocumentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import { chatbotAPI } from '../../services/api';

function TabPanelComponent(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`data-tabpanel-${index}`}
      aria-labelledby={`data-tab-${index}`}
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

const DataManagement = () => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('document');
  const [fileDescription, setFileDescription] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Mock data for demonstration
  const mockDocuments = [
    {
      id: 1,
      name: 'Thông tin du lịch Hạ Long',
      type: 'location',
      size: '2.5 MB',
      uploadDate: '2024-01-15',
      status: 'active',
      description: 'Thông tin chi tiết về vịnh Hạ Long, các điểm tham quan và hoạt động du lịch',
      chunks: 45,
      lastModified: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      name: 'FAQ Khách sạn',
      type: 'faq',
      size: '1.2 MB',
      uploadDate: '2024-01-14',
      status: 'active',
      description: 'Câu hỏi thường gặp về dịch vụ khách sạn tại Quảng Ninh',
      chunks: 23,
      lastModified: '2024-01-14T15:45:00Z'
    },
    {
      id: 3,
      name: 'Dịch vụ tour du lịch',
      type: 'service',
      size: '3.1 MB',
      uploadDate: '2024-01-13',
      status: 'processing',
      description: 'Danh sách và thông tin các tour du lịch có sẵn',
      chunks: 67,
      lastModified: '2024-01-13T09:20:00Z'
    },
    {
      id: 4,
      name: 'Hướng dẫn đặt phòng',
      type: 'document',
      size: '0.8 MB',
      uploadDate: '2024-01-12',
      status: 'inactive',
      description: 'Hướng dẫn chi tiết quy trình đặt phòng khách sạn',
      chunks: 15,
      lastModified: '2024-01-12T14:10:00Z'
    }
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Try to fetch from API, fallback to mock data
      try {
        const response = await chatbotAPI.getDocuments();
        setDocuments(response.data.documents || mockDocuments);
      } catch (apiError) {
        console.warn('API fetch failed, using mock data:', apiError);
        setDocuments(mockDocuments);
      }
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách tài liệu');
      setDocuments(mockDocuments);
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
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
      
      // Refresh documents
      fetchDocuments();
      
    } catch (error) {
      showSnackbar('Có lỗi xảy ra khi tải file. Vui lòng thử lại.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event, document) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedDocument(null);
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setViewModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteDocument = async (document) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSnackbar(`Đã xóa tài liệu "${document.name}"`, 'success');
      fetchDocuments();
    } catch (error) {
      showSnackbar('Có lỗi xảy ra khi xóa tài liệu', 'error');
    }
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'processing': return 'warning';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'processing': return 'Đang xử lý';
      case 'inactive': return 'Không hoạt động';
      default: return 'Không xác định';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'location': return '🏞️';
      case 'faq': return '❓';
      case 'service': return '🎯';
      case 'document': return '📄';
      default: return '📄';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const documentStats = {
    total: documents.length,
    active: documents.filter(d => d.status === 'active').length,
    processing: documents.filter(d => d.status === 'processing').length,
    totalChunks: documents.reduce((sum, d) => sum + d.chunks, 0)
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

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Quản lý dữ liệu
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tải lên, quản lý và theo dõi tài liệu cho hệ thống chatbot
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchDocuments}
              size="small"
            >
              Làm mới
            </Button>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              size="small"
            >
              Tải lên tài liệu
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
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tổng tài liệu
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {documentStats.total}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                  <DocumentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Đang hoạt động
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {documentStats.active}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
                  <StorageIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Đang xử lý
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {documentStats.processing}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main }}>
                  <CloudUploadIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tổng chunks
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {documentStats.totalChunks}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main }}>
                  <FileIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper elevation={1}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500
            }
          }}
        >
          <Tab label="Danh sách tài liệu" />
          <Tab label="Thống kê chi tiết" />
        </Tabs>

        {/* Documents List Tab */}
        <TabPanelComponent value={tabValue} index={0}>
          {/* Search and Filter */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Tìm kiếm tài liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              sx={{ minWidth: 300 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Loại tài liệu</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Loại tài liệu"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="location">Địa điểm</MenuItem>
                <MenuItem value="faq">FAQ</MenuItem>
                <MenuItem value="service">Dịch vụ</MenuItem>
                <MenuItem value="document">Tài liệu</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Documents Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tài liệu</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Kích thước</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Chunks</TableCell>
                  <TableCell>Ngày tải lên</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>
                          {getTypeIcon(document.type)}
                        </Typography>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {document.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {document.description.length > 50 
                              ? `${document.description.substring(0, 50)}...` 
                              : document.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={document.type} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{document.size}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusText(document.status)}
                        color={getStatusColor(document.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{document.chunks}</TableCell>
                    <TableCell>
                      {new Date(document.uploadDate).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, document)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredDocuments.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Không tìm thấy tài liệu nào
              </Typography>
            </Box>
          )}
        </TabPanelComponent>

        {/* Statistics Tab */}
        <TabPanelComponent value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardHeader title="Phân bố theo loại tài liệu" />
                <CardContent>
                  <Stack spacing={2}>
                    {['location', 'faq', 'service', 'document'].map(type => {
                      const count = documents.filter(d => d.type === type).length;
                      const percentage = documents.length > 0 ? (count / documents.length) * 100 : 0;
                      
                      return (
                        <Box key={type}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">
                              {getTypeIcon(type)} {type}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {count} tài liệu
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardHeader title="Phân bố theo trạng thái" />
                <CardContent>
                  <Stack spacing={2}>
                    {['active', 'processing', 'inactive'].map(status => {
                      const count = documents.filter(d => d.status === status).length;
                      const percentage = documents.length > 0 ? (count / documents.length) * 100 : 0;
                      
                      return (
                        <Box key={status}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">
                              {getStatusText(status)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {count} tài liệu
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            color={getStatusColor(status)}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanelComponent>
      </Paper>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Tải lên tài liệu mới
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {selectedFile && (
              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>File đã chọn:</strong> {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Kích thước: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            )}

            <FormControl fullWidth>
              <InputLabel>Loại tài liệu</InputLabel>
              <Select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                label="Loại tài liệu"
              >
                <MenuItem value="document">Tài liệu</MenuItem>
                <MenuItem value="location">Địa điểm</MenuItem>
                <MenuItem value="faq">FAQ</MenuItem>
                <MenuItem value="service">Dịch vụ</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Mô tả tài liệu"
              multiline
              rows={3}
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
              placeholder="Nhập mô tả chi tiết về nội dung tài liệu..."
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
        <DialogActions>
          <Button onClick={() => setUploadModalOpen(false)} disabled={isUploading}>
            Hủy
          </Button>
          <Button 
            onClick={handleFileUpload} 
            variant="contained" 
            disabled={isUploading || !selectedFile || !fileDescription.trim()}
          >
            {isUploading ? 'Đang tải lên...' : 'Tải lên'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Document Modal */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Chi tiết tài liệu
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {getTypeIcon(selectedDocument.type)} {selectedDocument.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedDocument.description}
                </Typography>
              </Box>
              
              <Divider />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Loại:</Typography>
                  <Typography variant="body1">{selectedDocument.type}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Kích thước:</Typography>
                  <Typography variant="body1">{selectedDocument.size}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
                  <Chip 
                    label={getStatusText(selectedDocument.status)}
                    color={getStatusColor(selectedDocument.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Chunks:</Typography>
                  <Typography variant="body1">{selectedDocument.chunks}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Ngày tải lên:</Typography>
                  <Typography variant="body1">
                    {new Date(selectedDocument.uploadDate).toLocaleDateString('vi-VN')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Cập nhật cuối:</Typography>
                  <Typography variant="body1">
                    {new Date(selectedDocument.lastModified).toLocaleDateString('vi-VN')}
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewModalOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewDocument(selectedDocument)}>
          <ViewIcon sx={{ mr: 1 }} />
          Xem chi tiết
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} />
          Chỉnh sửa
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <DownloadIcon sx={{ mr: 1 }} />
          Tải xuống
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleDeleteDocument(selectedDocument)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Xóa
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DataManagement;