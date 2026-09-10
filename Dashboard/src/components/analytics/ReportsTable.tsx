// src/components/analytics/ReportsTable.jsx
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Stack,
  Button,
  Tooltip,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  FilterList as FilterListIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { useState } from 'react';

const ConversationReportsTable = ({ data = [], title = "Báo cáo cuộc trò chuyện" }) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // Mock data if no data provided
  const mockData = [
    {
      id: 1,
      date: '2024-01-15',
      user: 'user123@email.com',
      messages: 12,
      duration: '5m 30s',
      satisfaction: 4.5,
      status: 'completed',
      language: 'vi',
      topics: ['du lịch', 'khách sạn']
    },
    {
      id: 2,
      date: '2024-01-15',
      user: 'user456@email.com',
      messages: 8,
      duration: '3m 15s',
      satisfaction: 4.0,
      status: 'completed',
      language: 'en',
      topics: ['booking', 'payment']
    },
    {
      id: 3,
      date: '2024-01-14',
      user: 'user789@email.com',
      messages: 15,
      duration: '7m 45s',
      satisfaction: 3.5,
      status: 'incomplete',
      language: 'vi',
      topics: ['hỗ trợ', 'khiếu nại']
    },
    {
      id: 4,
      date: '2024-01-14',
      user: 'user101@email.com',
      messages: 6,
      duration: '2m 20s',
      satisfaction: 5.0,
      status: 'completed',
      language: 'vi',
      topics: ['thông tin', 'giá cả']
    },
    {
      id: 5,
      date: '2024-01-13',
      user: 'user202@email.com',
      messages: 20,
      duration: '12m 10s',
      satisfaction: 4.2,
      status: 'completed',
      language: 'en',
      topics: ['tour', 'schedule']
    }
  ];

  const tableData = data.length > 0 ? data : mockData;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'incomplete': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'incomplete': return 'Chưa hoàn thành';
      case 'failed': return 'Thất bại';
      default: return 'Không xác định';
    }
  };

  const getSatisfactionIcon = (rating) => {
    return rating >= 4 ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />;
  };

  const filteredData = tableData.filter(row =>
    row.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Card elevation={1}>
      <CardHeader
        title={title}
        action={
          <Stack direction="row" spacing={1}>
            <Tooltip title="Xuất báo cáo">
              <IconButton size="small">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Bộ lọc">
              <IconButton size="small">
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      />
      <CardContent>
        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            placeholder="Tìm kiếm theo người dùng hoặc chủ đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 400 }}
          />
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Người dùng</TableCell>
                <TableCell>Ngày</TableCell>
                <TableCell align="center">Tin nhắn</TableCell>
                <TableCell align="center">Thời gian</TableCell>
                <TableCell align="center">Đánh giá</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
                <TableCell align="center">Ngôn ngữ</TableCell>
                <TableCell>Chủ đề</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          fontSize: '0.8rem'
                        }}
                      >
                        {row.user.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {row.user}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {row.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(row.date).toLocaleDateString('vi-VN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.messages}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontFamily="monospace">
                      {row.duration}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      {getSatisfactionIcon(row.satisfaction)}
                      <Typography variant="body2" fontWeight="bold">
                        {row.satisfaction}/5
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusText(row.status)}
                      color={getStatusColor(row.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.language === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {row.topics.slice(0, 2).map((topic, index) => (
                        <Chip
                          key={index}
                          label={topic}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))}
                      {row.topics.length > 2 && (
                        <Chip
                          label={`+${row.topics.length - 2}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, row)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
          }
        />

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <ViewIcon sx={{ mr: 1 }} />
            Xem chi tiết
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <DownloadIcon sx={{ mr: 1 }} />
            Xuất dữ liệu
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

// Document Analytics Table
const DocumentAnalyticsTable = ({ data = [], title = "Phân tích tài liệu" }) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Mock data for document analytics
  const mockData = [
    {
      id: 1,
      name: 'Thông tin du lịch Hạ Long',
      type: 'location',
      usage: 245,
      accuracy: 94.5,
      lastUsed: '2024-01-15',
      chunks: 45,
      size: '2.5 MB'
    },
    {
      id: 2,
      name: 'FAQ Khách sạn',
      type: 'faq',
      usage: 189,
      accuracy: 96.2,
      lastUsed: '2024-01-15',
      chunks: 23,
      size: '1.2 MB'
    },
    {
      id: 3,
      name: 'Dịch vụ tour du lịch',
      type: 'service',
      usage: 156,
      accuracy: 91.8,
      lastUsed: '2024-01-14',
      chunks: 67,
      size: '3.1 MB'
    }
  ];

  const tableData = data.length > 0 ? data : mockData;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 95) return 'success';
    if (accuracy >= 90) return 'warning';
    return 'error';
  };

  const paginatedData = tableData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Card elevation={1}>
      <CardHeader title={title} />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tài liệu</TableCell>
                <TableCell align="center">Lượt sử dụng</TableCell>
                <TableCell align="center">Độ chính xác</TableCell>
                <TableCell align="center">Chunks</TableCell>
                <TableCell align="center">Kích thước</TableCell>
                <TableCell>Sử dụng cuối</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>
                        {getTypeIcon(row.type)}
                      </Typography>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {row.name}
                        </Typography>
                        <Chip
                          label={row.type}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 18 }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold">
                      {row.usage.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${row.accuracy}%`}
                      color={getAccuracyColor(row.accuracy)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {row.chunks}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {row.size}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(row.lastUsed).toLocaleDateString('vi-VN')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={tableData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
          }
        />
      </CardContent>
    </Card>
  );
};

export { ConversationReportsTable, DocumentAnalyticsTable };
export default ConversationReportsTable;