// src/pages/Unauthorized.jsx
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import {
  Login as LoginIcon,
  Home as HomeIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UnauthorizedPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogin = () => {
    logout(); // Clear any existing session
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        py: 3
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={8}
          sx={{
            p: 6,
            borderRadius: 3,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
          }}
        >
          {/* Unauthorized Icon */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)}, ${alpha(theme.palette.warning.main, 0.1)})`,
              mb: 3,
              border: `2px solid ${alpha(theme.palette.error.main, 0.2)}`
            }}
          >
            <BlockIcon sx={{ fontSize: 60, color: theme.palette.error.main }} />
          </Box>

          {/* 403 Text */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '4rem', md: '6rem' },
              fontWeight: 'bold',
              background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            403
          </Typography>

          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            fontWeight="bold"
            color="text.primary"
          >
            Truy cập bị từ chối
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
          >
            Bạn không có quyền truy cập vào trang này. Vui lòng đăng nhập với tài khoản 
            có quyền phù hợp hoặc liên hệ với quản trị viên để được hỗ trợ.
          </Typography>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              onClick={handleLogin}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                '&:hover': {
                  boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.5)}`,
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Đăng nhập lại
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderColor: theme.palette.primary.main,
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Về trang chủ
            </Button>
          </Box>

          {/* Security Notice */}
          <Box 
            sx={{ 
              mt: 4, 
              pt: 3, 
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: alpha(theme.palette.warning.main, 0.05),
              borderRadius: 2,
              p: 2
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Lưu ý bảo mật:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hệ thống ServiceHub chỉ dành cho quản trị viên được ủy quyền. 
              Mọi hoạt động truy cập đều được ghi lại và giám sát.
            </Typography>
          </Box>

          {/* Contact Info */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Cần hỗ trợ? Liên hệ với quản trị viên:
            </Typography>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
              admin@servicehub.com
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default UnauthorizedPage;