// src/pages/Profile.jsx
import type { AlertColor } from '@mui/material';
import {
  Container,
  Paper,
  Typography,
  Box,
  // MUI v7 doi Grid sang API moi (size={{xs,lg}}) va bo item/xs/lg.
  // Code nay viet theo API v5/v6 nen tren v7 cac prop do bi BO AM THAM
  // -> moi o xep full-width thay vi chia cot. GridLegacy la ban Grid cu,
  // giu dung layout ma code mong doi.
  // TODO: migrate sang Grid moi: <Grid size={{ xs: 12, lg: 6 }}> khong co item.
  GridLegacy as Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Button,
  TextField,
  Divider,
  Stack,
  Chip,
  Alert,
  useTheme,
  alpha,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
  const theme = useTheme();
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  // AlertColor cho `type`: gia tri nay di thang vao Alert severity.
  const [message, setMessage] = useState<{ text: string; type: AlertColor | '' }>({
    text: '',
    type: '',
  });
  
  const [formData, setFormData] = useState({
    businessName: user?.businessInfo?.business_name || '',
    businessType: user?.businessInfo?.business_type || '',
    contactPhone: user?.businessInfo?.phone || '',
    address: user?.businessInfo?.address || '',
    email: user?.email || ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await updateProfile(formData);
      setIsEditing(false);
      setMessage({ text: 'Cập nhật thông tin thành công!', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Có lỗi xảy ra khi cập nhật thông tin', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      businessName: user?.businessInfo?.business_name || '',
      businessType: user?.businessInfo?.business_type || '',
      contactPhone: user?.businessInfo?.phone || '',
      address: user?.businessInfo?.address || '',
      email: user?.email || ''
    });
    setIsEditing(false);
    setMessage({ text: '', type: '' });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Hồ sơ cá nhân
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý thông tin tài khoản và cài đặt bảo mật
        </Typography>
      </Box>

      {/* Message Alert */}
      {message.text && message.type && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage({ text: '', type: '' })}
        >
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Overview */}
        <Grid item xs={12} md={4}>
          <Card elevation={1} sx={{ height: 'fit-content' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '2rem'
                }}
              >
                {user?.businessInfo?.business_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </Avatar>
              
              <Typography variant="h5" gutterBottom fontWeight="bold">
                {user?.businessInfo?.business_name || 'Admin User'}
              </Typography>
              
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                <Chip
                  icon={<AdminIcon />}
                  label="Quản trị viên"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  icon={<VerifiedIcon />}
                  label="Đã xác thực"
                  color="success"
                  variant="outlined"
                />
              </Stack>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>
              
              <Typography variant="caption" color="text.secondary">
                Tham gia từ: {new Date(user?.created_at || Date.now()).toLocaleDateString('vi-VN')}
              </Typography>
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card elevation={1} sx={{ mt: 3 }}>
            <CardHeader
              title="Bảo mật"
              avatar={<SecurityIcon color="primary" />}
            />
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Đăng nhập cuối</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.last_login ? new Date(user.last_login).toLocaleDateString('vi-VN') : 'Chưa có'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Trạng thái tài khoản</Typography>
                  <Chip 
                    label={user?.is_active ? 'Hoạt động' : 'Tạm khóa'} 
                    color={user?.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SecurityIcon />}
                  fullWidth
                  disabled
                >
                  Đổi mật khẩu
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card elevation={1}>
            <CardHeader
              title="Thông tin chi tiết"
              action={
                <Box>
                  {!isEditing ? (
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => setIsEditing(true)}
                      variant="outlined"
                      size="small"
                    >
                      Chỉnh sửa
                    </Button>
                  ) : (
                    <Stack direction="row" spacing={1}>
                      <Button
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        variant="contained"
                        size="small"
                        disabled={loading}
                      >
                        Lưu
                      </Button>
                      <Button
                        startIcon={<CancelIcon />}
                        onClick={handleCancel}
                        variant="outlined"
                        size="small"
                        disabled={loading}
                      >
                        Hủy
                      </Button>
                    </Stack>
                  )}
                </Box>
              }
            />
            <CardContent>
              <Grid container spacing={3}>
                {/* Business Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Thông tin doanh nghiệp
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <BusinessIcon sx={{ color: theme.palette.text.secondary, mt: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          label="Tên doanh nghiệp"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleChange}
                          variant="outlined"
                          size="small"
                        />
                      ) : (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            Tên doanh nghiệp
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {user?.businessInfo?.business_name || 'Chưa cập nhật'}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <PersonIcon sx={{ color: theme.palette.text.secondary, mt: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          label="Loại hình kinh doanh"
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleChange}
                          variant="outlined"
                          size="small"
                        />
                      ) : (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            Loại hình kinh doanh
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {user?.businessInfo?.business_type || 'Chưa cập nhật'}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* Contact Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Thông tin liên hệ
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <EmailIcon sx={{ color: theme.palette.text.secondary, mt: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {user?.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Email không thể thay đổi
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <PhoneIcon sx={{ color: theme.palette.text.secondary, mt: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          label="Số điện thoại"
                          name="contactPhone"
                          value={formData.contactPhone}
                          onChange={handleChange}
                          variant="outlined"
                          size="small"
                        />
                      ) : (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            Số điện thoại
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {user?.businessInfo?.phone || 'Chưa cập nhật'}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <LocationIcon sx={{ color: theme.palette.text.secondary, mt: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          label="Địa chỉ"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          variant="outlined"
                          size="small"
                          multiline
                          rows={2}
                        />
                      ) : (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            Địa chỉ
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {user?.businessInfo?.address || 'Chưa cập nhật'}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;