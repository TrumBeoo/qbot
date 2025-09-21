import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Stack,
  Alert,
  Snackbar,
  CircularProgress,
  Container,
  Toolbar,
  AppBar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import ImageUploader from './ImageUploader';
import { api } from '../../services/api';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const StyledCardMedia = styled(CardMedia)({
  height: 200,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
});

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2, 0),
}));

const ActionButtonContainer = styled(Box)({
  display: 'flex',
  gap: '8px',
  justifyContent: 'flex-end',
  marginTop: 'auto',
});

const ImageManagement = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteImageId, setDeleteImageId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/images');
      if (response.data.status === 'success') {
        setImages(response.data.data);
      }
    } catch (error) {
      showSnackbar('Không thể tải danh sách ảnh', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleUploadSuccess = () => {
    fetchImages();
    setIsUploadOpen(false);
    showSnackbar('Ảnh đã được tải lên thành công');
  };

  const handleViewImage = (image) => {
    setSelectedImage(image);
    setIsViewOpen(true);
  };

  const handleDeleteClick = (imageId) => {
    setDeleteImageId(imageId);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/dashboard/images/${deleteImageId}`);
      showSnackbar('Ảnh đã được xóa');
      fetchImages();
    } catch (error) {
      showSnackbar('Không thể xóa ảnh', 'error');
    } finally {
      setIsDeleteOpen(false);
      setDeleteImageId(null);
    }
  };

  const getImageTypeColor = (type) => {
    switch (type) {
      case 'main': return 'primary';
      case 'gallery': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <HeaderContainer>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Quản lý ảnh Chatbot
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsUploadOpen(true)}
          size="large"
        >
          Tải ảnh lên
        </Button>
      </HeaderContainer>

      <Grid container spacing={3}>
        {images.map((image) => (
          <Grid item xs={12} sm={6} md={4} key={image.id}>
            <StyledCard>
              <StyledCardMedia
                image={image.full_url}
                title={image.caption || image.location_name}
                onError={(e) => {
                  e.target.style.backgroundImage = 'url(https://via.placeholder.com/300x200?text=No+Image)';
                }}
              />
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack spacing={2} sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      label={image.image_type}
                      color={getImageTypeColor(image.image_type)}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(image.created_at)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="h6" component="h3" fontWeight="bold" noWrap>
                    {image.location_name}
                  </Typography>
                  
                  {image.caption && (
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {image.caption}
                    </Typography>
                  )}
                </Stack>

                <ActionButtonContainer>
                  <IconButton
                    color="primary"
                    onClick={() => handleViewImage(image)}
                    aria-label="Xem chi tiết"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteClick(image.id)}
                    aria-label="Xóa ảnh"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ActionButtonContainer>
              </CardContent>
            </StyledCard>
          </Grid>
        ))}
      </Grid>

      {/* Upload Dialog */}
      <Dialog
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Tải ảnh lên
          <IconButton
            aria-label="close"
            onClick={() => setIsUploadOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <ImageUploader onSuccess={handleUploadSuccess} />
        </DialogContent>
      </Dialog>

      {/* View Image Dialog */}
      <Dialog
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chi tiết ảnh
          <IconButton
            aria-label="close"
            onClick={() => setIsViewOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedImage && (
            <Stack spacing={3}>
              <Box
                component="img"
                src={selectedImage.full_url}
                alt={selectedImage.caption}
                sx={{
                  width: '100%',
                  maxHeight: 400,
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
              />
              <Stack spacing={2}>
                <Typography variant="body1">
                  <strong>Địa điểm:</strong> {selectedImage.location_name}
                </Typography>
                <Typography variant="body1">
                  <strong>Loại:</strong> {selectedImage.image_type}
                </Typography>
                <Typography variant="body1">
                  <strong>Danh mục:</strong> {selectedImage.category}
                </Typography>
                {selectedImage.caption && (
                  <Typography variant="body1">
                    <strong>Mô tả:</strong> {selectedImage.caption}
                  </Typography>
                )}
                <Typography variant="body1">
                  <strong>Thứ tự hiển thị:</strong> {selectedImage.display_order}
                </Typography>
                <Typography variant="body1">
                  <strong>Ngày tạo:</strong> {formatDateTime(selectedImage.created_at)}
                </Typography>
              </Stack>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Xóa ảnh
        </DialogTitle>
        <DialogContent>
          <Typography id="alert-dialog-description">
            Bạn có chắc chắn muốn xóa ảnh này? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ImageManagement;