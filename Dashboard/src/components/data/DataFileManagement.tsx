import React, { useState, useEffect, useRef } from 'react';
import type { AlertColor } from '@mui/material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  // MUI v7 doi Grid sang API moi (size={{xs,lg}}) va bo item/xs/lg.
  // Code nay viet theo API v5/v6 nen tren v7 cac prop do bi BO AM THAM
  // -> moi o xep full-width thay vi chia cot. GridLegacy la ban Grid cu,
  // giu dung layout ma code mong doi.
  // TODO: migrate sang Grid moi: <Grid size={{ xs: 12, lg: 6 }}> khong co item.
  GridLegacy as Grid,
  Typography,
  Modal,
  Paper,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  TextField,
  FormControl,
  FormLabel,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CloudUpload as UploadIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { api } from '../../services/api';
import MongoDBSyncManagement from './MongoDBSyncManagement';

const StyledModal = styled(Modal)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const ModalContent = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  minWidth: 600,
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow: 'auto',
}));

const DataFileManagement = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [deleteFileName, setDeleteFileName] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [newFile, setNewFile] = useState({ filename: '', content: '' });
  
  // Modal states
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [showMongoSync, setShowMongoSync] = useState(false);
  
  // Toast state
  // AlertColor thay vi string: Alert.severity chi nhan
  // 'success' | 'info' | 'warning' | 'error'.
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({ open: false, message: '', severity: 'info' });
  
  // useRef<HTMLInputElement>: khong co type param thi ref la unknown,
  // va .click() ben duoi bao khong ton tai.
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const showToast = (message: string, severity: AlertColor = 'info') => {
    setToast({ open: true, message, severity });
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/data-files');
      if (response.data.status === 'success') {
        setFiles(response.data.data);
      }
    } catch (error) {
      showToast('Không thể tải danh sách file', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = async (filename) => {
    try {
      const response = await api.get(`/dashboard/data-files/${filename}`);
      if (response.data.status === 'success') {
        setSelectedFile(response.data.data);
        setIsViewOpen(true);
      }
    } catch (error) {
      showToast('Không thể tải nội dung file', 'error');
    }
  };

  const handleEditFile = async (filename) => {
    try {
      const response = await api.get(`/dashboard/data-files/${filename}`);
      if (response.data.status === 'success') {
        setEditFile(response.data.data);
        setIsEditOpen(true);
      }
    } catch (error) {
      showToast('Không thể tải nội dung file', 'error');
    }
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/dashboard/data-files/${editFile.filename}`, {
        content: editFile.content
      });
      showToast('File đã được cập nhật', 'success');
      fetchFiles();
      setIsEditOpen(false);
    } catch (error) {
      showToast('Không thể cập nhật file', 'error');
    }
  };

  const handleCreateFile = async () => {
    try {
      await api.post('/dashboard/data-files', newFile);
      showToast('File đã được tạo', 'success');
      setNewFile({ filename: '', content: '' });
      fetchFiles();
      setIsCreateOpen(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể tạo file', 'error');
    }
  };

  const handleDeleteClick = (filename) => {
    setDeleteFileName(filename);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/dashboard/data-files/${deleteFileName}`);
      showToast('File đã được xóa', 'success');
      fetchFiles();
    } catch (error) {
      showToast('Không thể xóa file', 'error');
    } finally {
      setIsDeleteOpen(false);
      setDeleteFileName(null);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/dashboard/data-files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('File đã được tải lên', 'success');
      fetchFiles();
      setIsUploadOpen(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể tải file lên', 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('vi-VN');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản lý dữ liệu Chatbot
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            startIcon={<SyncIcon />}
            variant="contained"
            color="secondary"
            onClick={() => setShowMongoSync(true)}
          >
            MongoDB Sync
          </Button>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            color="primary"
            onClick={() => setIsCreateOpen(true)}
          >
            Tạo file mới
          </Button>
          <Button
            startIcon={<UploadIcon />}
            variant="contained"
            color="success"
            onClick={() => setIsUploadOpen(true)}
          >
            Tải file lên
          </Button>
        </Stack>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {files.map((file) => (
            <Grid item xs={12} sm={6} md={4} key={file.name}>
              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" component="div">
                        {file.name}
                      </Typography>
                      <Chip label="TXT" color="primary" size="small" />
                    </Box>
                  }
                />
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Kích thước: {formatFileSize(file.size)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cập nhật: {formatDate(file.modified)}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewFile(file.name)}
                        title="Xem nội dung"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleEditFile(file.name)}
                        title="Chỉnh sửa"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(file.name)}
                        title="Xóa file"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* View File Modal */}
      <StyledModal open={isViewOpen} onClose={() => setIsViewOpen(false)}>
        <ModalContent>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Xem nội dung: {selectedFile?.filename}
          </Typography>
          {selectedFile && (
            <TextField
              multiline
              rows={20}
              fullWidth
              value={selectedFile.content}
              InputProps={{
                readOnly: true,
              }}
              variant="outlined"
            />
          )}
        </ModalContent>
      </StyledModal>

      {/* Edit File Modal */}
      <StyledModal open={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <ModalContent>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Chỉnh sửa: {editFile?.filename}
          </Typography>
          {editFile && (
            <Stack spacing={2}>
              <TextField
                multiline
                rows={20}
                fullWidth
                value={editFile.content}
                onChange={(e) => setEditFile({...editFile, content: e.target.value})}
                variant="outlined"
              />
              <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
                <Button onClick={() => setIsEditOpen(false)}>Hủy</Button>
                <Button variant="contained" onClick={handleSaveEdit}>
                  Lưu thay đổi
                </Button>
              </Stack>
            </Stack>
          )}
        </ModalContent>
      </StyledModal>

      {/* Create File Modal */}
      <StyledModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <ModalContent>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Tạo file mới
          </Typography>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <FormLabel>Tên file</FormLabel>
              <TextField
                fullWidth
                value={newFile.filename}
                onChange={(e) => setNewFile({...newFile, filename: e.target.value})}
                placeholder="Nhập tên file (không cần .txt)"
                variant="outlined"
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel>Nội dung</FormLabel>
              <TextField
                multiline
                rows={15}
                fullWidth
                value={newFile.content}
                onChange={(e) => setNewFile({...newFile, content: e.target.value})}
                placeholder="Nhập nội dung dữ liệu cho chatbot..."
                variant="outlined"
              />
            </FormControl>
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsCreateOpen(false)}>Hủy</Button>
              <Button 
                variant="contained"
                onClick={handleCreateFile}
                disabled={!newFile.filename || !newFile.content}
              >
                Tạo file
              </Button>
            </Stack>
          </Stack>
        </ModalContent>
      </StyledModal>

      {/* Upload File Modal */}
      <StyledModal open={isUploadOpen} onClose={() => setIsUploadOpen(false)}>
        <ModalContent>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Tải file lên
          </Typography>
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <Typography>Chọn file .txt để tải lên:</Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              startIcon={<UploadIcon />}
            >
              Chọn file
            </Button>
            <Typography variant="caption" color="text.secondary">
              Chỉ chấp nhận file .txt
            </Typography>
          </Stack>
        </ModalContent>
      </StyledModal>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        <DialogTitle>Xóa file</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa file "{deleteFileName}"? 
            Hành động này không thể hoàn tác và sẽ ảnh hưởng đến dữ liệu chatbot.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
          <Button color="error" onClick={handleDeleteConfirm}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* MongoDB Sync Modal */}
      <StyledModal open={showMongoSync} onClose={() => setShowMongoSync(false)}>
        <ModalContent sx={{ minWidth: 800, maxWidth: '95vw' }}>
          <MongoDBSyncManagement />
        </ModalContent>
      </StyledModal>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setToast({ ...toast, open: false })} 
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DataFileManagement;