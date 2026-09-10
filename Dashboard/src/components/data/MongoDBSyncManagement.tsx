import React, { useState, useEffect } from 'react';
import type { AlertColor } from '@mui/material';
import {
  Box,
  Typography,
  Button,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Chip,
  Snackbar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  CloudSync as CloudSyncIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { api } from '../../services/api';

const MongoDBSyncManagement = () => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncType, setSyncType] = useState('');
  // AlertColor thay vi string: Alert.severity chi nhan
  // 'success' | 'info' | 'warning' | 'error'.
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const response = await api.get('/dashboard/mongodb/sync-status');
      if (response.data.status === 'success') {
        setSyncStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
      showToast('Lỗi khi tải trạng thái đồng bộ', 'error');
    }
  };

  const showToast = (message: string, severity: AlertColor = 'info') => {
    setToast({ open: true, message, severity });
  };

  const openSyncDialog = (type) => {
    setSyncType(type);
    setShowSyncDialog(true);
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const response = await api.post('/dashboard/mongodb/sync-all');
      if (response.data.status === 'success') {
        setSyncResult(response.data.data);
        showToast('Đồng bộ thành công!', 'success');
        await fetchSyncStatus();
      } else {
        showToast('Lỗi khi đồng bộ: ' + response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error syncing all files:', error);
      showToast('Lỗi khi đồng bộ tất cả file', 'error');
    } finally {
      setSyncing(false);
      setShowSyncDialog(false);
    }
  };

  const handleForceResync = async () => {
    setSyncing(true);
    try {
      const response = await api.post('/dashboard/mongodb/force-resync');
      if (response.data.status === 'success') {
        setSyncResult(response.data.data);
        showToast('Đồng bộ lại thành công!', 'success');
        await fetchSyncStatus();
      } else {
        showToast('Lỗi khi đồng bộ lại: ' + response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error force resyncing:', error);
      showToast('Lỗi khi đồng bộ lại', 'error');
    } finally {
      setSyncing(false);
      setShowSyncDialog(false);
    }
  };

  const handleSyncFile = async (filename) => {
    try {
      const response = await api.post(`/dashboard/mongodb/sync-file/${filename}`);
      if (response.data.status === 'success') {
        showToast(`File ${filename} đã được đồng bộ`, 'success');
        await fetchSyncStatus();
      } else {
        showToast('Lỗi khi đồng bộ file: ' + response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error syncing file:', error);
      showToast('Lỗi khi đồng bộ file', 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Chưa có';
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản lý đồng bộ MongoDB
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            onClick={fetchSyncStatus}
            disabled={syncing}
          >
            Làm mới
          </Button>
          <Button
            startIcon={<SyncIcon />}
            variant="contained"
            color="primary"
            onClick={() => openSyncDialog('sync-all')}
            disabled={syncing}
          >
            Đồng bộ tất cả
          </Button>
          <Button
            startIcon={<CloudSyncIcon />}
            variant="contained"
            color="warning"
            onClick={() => openSyncDialog('force-resync')}
            disabled={syncing}
          >
            Đồng bộ lại
          </Button>
        </Stack>
      </Box>

      {/* Sync Status Overview */}
      {syncStatus && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Tổng quan trạng thái đồng bộ" />
          <CardContent>
            <Stack direction="row" spacing={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="success.main">
                  {syncStatus.counts?.active || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  File đang hoạt động
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="warning.main">
                  {syncStatus.counts?.inactive || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  File không hoạt động
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="error.main">
                  {syncStatus.counts?.deleted || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  File đã xóa
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary.main">
                  {syncStatus.counts?.total || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng cộng
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Active Files Table */}
      {syncStatus?.active_files && syncStatus.active_files.length > 0 && (
        <Card>
          <CardHeader title="File đang hoạt động trong MongoDB" />
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tên file</TableCell>
                    <TableCell>Kích thước</TableCell>
                    <TableCell>Số dòng</TableCell>
                    <TableCell>Số từ</TableCell>
                    <TableCell>Đồng bộ lần cuối</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {syncStatus.active_files.map((file) => (
                    <TableRow key={file._id}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CheckCircleIcon color="success" fontSize="small" />
                          <Typography variant="body2">{file.filename}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {formatFileSize(file.file_size)}
                      </TableCell>
                      <TableCell>
                        {file.metadata?.line_count || 0}
                      </TableCell>
                      <TableCell>
                        {file.metadata?.word_count || 0}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(file.sync_timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<SyncIcon />}
                          onClick={() => handleSyncFile(file.filename)}
                          disabled={syncing}
                        >
                          Đồng bộ lại
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* No Files Message */}
      {syncStatus?.active_files && syncStatus.active_files.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography>
            Chưa có file nào được đồng bộ vào MongoDB. 
            Hãy sử dụng nút "Đồng bộ tất cả" để bắt đầu đồng bộ dữ liệu.
          </Typography>
        </Alert>
      )}

      {/* Sync Result Display */}
      {syncResult && (
        <Card sx={{ mt: 3 }}>
          <CardHeader title="Kết quả đồng bộ gần nhất" />
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Tổng số file: {syncResult.total_files || 0}
                </Typography>
                <Typography variant="body2" color="success.main">
                  Thành công: {syncResult.successful || 0}
                </Typography>
                <Typography variant="body2" color="error.main">
                  Thất bại: {syncResult.failed || 0}
                </Typography>
              </Box>
              
              {syncResult.summary && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Chi tiết:
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Chip 
                      label={`Tạo mới: ${syncResult.summary.created}`} 
                      color="success" 
                      size="small" 
                    />
                    <Chip 
                      label={`Cập nhật: ${syncResult.summary.updated}`} 
                      color="primary" 
                      size="small" 
                    />
                    <Chip 
                      label={`Không thay đổi: ${syncResult.summary.no_change}`} 
                      color="default" 
                      size="small" 
                    />
                  </Stack>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Sync Confirmation Dialog */}
      <Dialog open={showSyncDialog} onClose={() => setShowSyncDialog(false)}>
        <DialogTitle>
          {syncType === 'sync-all' ? 'Đồng bộ tất cả file' : 'Đồng bộ lại tất cả file'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {syncType === 'sync-all' 
              ? 'Bạn có muốn đồng bộ tất cả file từ thư mục data vào MongoDB không?'
              : 'Bạn có muốn xóa tất cả dữ liệu cũ và đồng bộ lại từ đầu không? Hành động này không thể hoàn tác.'
            }
          </Typography>
          {syncing && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Đang xử lý...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSyncDialog(false)} disabled={syncing}>
            Hủy
          </Button>
          <Button 
            onClick={syncType === 'sync-all' ? handleSyncAll : handleForceResync}
            color={syncType === 'sync-all' ? 'primary' : 'warning'}
            disabled={syncing}
          >
            {syncing ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert 
          onClose={() => setToast({ ...toast, open: false })} 
          severity={toast.severity}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MongoDBSyncManagement;