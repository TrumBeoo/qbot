// src/pages/Login.jsx
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  Stack,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import { 
  Login as LoginIcon,
  Visibility,
  VisibilityOff,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IconButton, InputAdornment } from '@mui/material';

const LoginPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.email || !formData.password) {
        setError('Vui lòng nhập đầy đủ thông tin');
        return;
      }

      // Call login API
      const result = await login(formData);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        background: "url('/images/bg.jpg') no-repeat center/cover",
        minHeight: '100vh',
        //background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        py: 3
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                mb: 2,
                boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`
              }}
            >
              <AdminIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              gutterBottom
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              QBot Admin
            </Typography>
            
            <Typography variant="body1" color="text.secondary">
              Đăng nhập để quản lý hệ thống chatbot du lịch Quảng Ninh
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                variant="outlined"
                required
                disabled={loading}
                autoComplete="email"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Mật khẩu"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                variant="outlined"
                required
                disabled={loading}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        edge="end"
                        disabled={loading}
                        aria-label="toggle password visibility"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                
                
                //startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                sx={{
                  py: 1,
                  borderRadius: 2,
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  //background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color:'blue.500',
                  
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  '&:hover': {
                    boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.5)}`,
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    background: theme.palette.grey[300],
                    boxShadow: 'none',
                    transform: 'none',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </Stack>
          </Box>

          {/* System Info */}
          <Paper
            elevation={0}
            sx={{
              mt: 4,
              p: 3,
              backgroundColor: alpha(theme.palette.info.main, 0.05),
              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Hệ thống quản lý Chatbot Du lịch Quảng Ninh</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Chỉ dành cho quản trị viên được ủy quyền
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Phiên bản: 2.1.0 | © 2025 - ServiceHub
            </Typography>
          </Paper>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;