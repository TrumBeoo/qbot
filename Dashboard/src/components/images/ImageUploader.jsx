import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  TextField,
  Select,
  MenuItem,
  Stack,
  Typography,
  LinearProgress,
  Alert,
  Card,
  CardMedia,
  FormHelperText,
  Autocomplete,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { api } from '../../services/api';

// Styled component for file input
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ImageUploader = ({ onSuccess }) => {
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    location_id: '',
    location_name: '',
    image_type: 'gallery',
    caption: '',
    category: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isNewLocation, setIsNewLocation] = useState(false);

  // Predefined categories for new locations
  const categories = [
    'Du lịch',
    'Khách sạn', 
    'Nhà hàng',
    'Giải trí',
    'Mua sắm',
    'Dịch vụ',
    'Thành phố',
    'Khác'
  ];

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/dashboard/locations');
      if (response.data.status === 'success') {
        setLocations(response.data.data);
      }
    } catch (error) {
      setError('Không thể tải danh sách địa điểm');
    }
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 3000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showError('Chỉ chấp nhận file ảnh (PNG, JPG, JPEG, GIF, WebP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Kích thước file không được vượt quá 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationChange = (event, newValue) => {
    if (newValue) {
      if (typeof newValue === 'string') {
        // User typed a new location name
        setSelectedLocation({ name: newValue, id: null });
        setFormData(prev => ({
          ...prev,
          location_id: '',
          location_name: newValue
        }));
        setIsNewLocation(true);
      } else {
        // User selected an existing location
        setSelectedLocation(newValue);
        setFormData(prev => ({
          ...prev,
          location_id: newValue.id,
          location_name: newValue.name
        }));
        setIsNewLocation(false);
      }
    } else {
      setSelectedLocation(null);
      setFormData(prev => ({
        ...prev,
        location_id: '',
        location_name: ''
      }));
      setIsNewLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      showError('Vui lòng chọn file ảnh');
      return;
    }

    if (!formData.location_name) {
      showError('Vui lòng chọn hoặc nhập tên địa điểm');
      return;
    }

    if (isNewLocation && !formData.category) {
      showError('Vui lòng chọn danh mục cho địa điểm mới');
      return;
    }

    setUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('image', selectedFile);
      
      if (isNewLocation) {
        // Create new location first, then upload image
        uploadData.append('location_name', formData.location_name);
        uploadData.append('category', formData.category);
      } else {
        uploadData.append('location_id', formData.location_id);
      }
      
      uploadData.append('image_type', formData.image_type);
      uploadData.append('caption', formData.caption);

      const response = await api.post('/dashboard/images/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        onSuccess();
        showSuccess('Tải ảnh lên thành công!');
        
        // Refresh locations list if new location was created
        if (isNewLocation) {
          await fetchLocations();
        }
        
        // Reset form
        setFormData({
          location_id: '',
          location_name: '',
          image_type: 'gallery',
          caption: '',
          category: '',
        });
        setSelectedFile(null);
        setPreview(null);
        setSelectedLocation(null);
        setIsNewLocation(false);
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Không thể tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert severity="success" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* File Upload */}
        <FormControl required>
          <Button
            component="label"
            variant="outlined"
            sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
          >
            {selectedFile ? selectedFile.name : 'Chọn ảnh'}
            <VisuallyHiddenInput
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </Button>
          <FormHelperText>
            Chấp nhận: PNG, JPG, JPEG, GIF, WebP (tối đa 5MB)
          </FormHelperText>
        </FormControl>

        {/* Image Preview */}
        {preview && (
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" mb={1}>
              Xem trước:
            </Typography>
            <Card sx={{ maxWidth: 300 }}>
              <CardMedia
                component="img"
                height="200"
                image={preview}
                alt="Preview"
                sx={{ objectFit: 'contain' }}
              />
            </Card>
          </Box>
        )}

        {/* Location Autocomplete */}
        <FormControl required fullWidth>
          <Autocomplete
            value={selectedLocation}
            onChange={handleLocationChange}
            inputValue={formData.location_name}
            onInputChange={(event, newInputValue) => {
              setFormData(prev => ({
                ...prev,
                location_name: newInputValue
              }));
            }}
            options={locations}
            getOptionLabel={(option) => {
              if (typeof option === 'string') {
                return option;
              }
              return `${option.name} (${option.category})`;
            }}
            freeSolo
            renderInput={(params) => (
              <TextField
                {...params}
                label="Địa điểm *"
                placeholder="VD: Vịnh Hạ Long, Động Thiên Cung, Bãi Cháy..."
                helperText={
                  isNewLocation 
                    ? "Bạn đang tạo địa điểm mới - vui lòng chọn danh mục bên dưới" 
                    : "Gợi ý: Vịnh Hạ Long, Động Thiên Cung, Động Đầu Gỗ, Bãi Cháy, Tuần Châu, Yên Tử..."
                }
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography variant="body1">{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.category}
                  </Typography>
                </Box>
              </Box>
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option.name} {...getTagProps({ index })} />
              ))
            }
          />
        </FormControl>

        {/* Category Select - Only show for new locations */}
        {isNewLocation && (
          <FormControl required fullWidth>
            <InputLabel>Danh mục *</InputLabel>
            <Select
              name="category"
              value={formData.category}
              label="Danh mục *"
              onChange={handleInputChange}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Chọn danh mục cho địa điểm mới</FormHelperText>
          </FormControl>
        )}

        {/* Image Type Select */}
        <FormControl fullWidth>
          <InputLabel>Loại ảnh</InputLabel>
          <Select
            name="image_type"
            value={formData.image_type}
            label="Loại ảnh"
            onChange={handleInputChange}
          >
            <MenuItem value="gallery">Gallery</MenuItem>
            <MenuItem value="main">Main (Ảnh chính)</MenuItem>
          </Select>
        </FormControl>

        {/* Caption Text Field */}
        <TextField
          name="caption"
          label="Mô tả ảnh"
          multiline
          rows={3}
          value={formData.caption}
          onChange={handleInputChange}
          placeholder="Nhập mô tả cho ảnh (tùy chọn)"
          fullWidth
        />

        {/* Upload Progress */}
        {uploading && (
          <Box width="100%">
            <Typography variant="body2" mb={1}>
              Đang tải lên...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {/* Submit Button */}
        <Box display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            disabled={
              uploading || 
              !selectedFile || 
              !formData.location_name ||
              (isNewLocation && !formData.category)
            }
            sx={{ minWidth: 120 }}
          >
            {uploading ? 'Đang tải lên' : 'Tải lên'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default ImageUploader;