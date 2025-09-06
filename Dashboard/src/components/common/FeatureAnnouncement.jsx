// src/components/common/FeatureAnnouncement.jsx
import {
  Box,
  Alert,
  IconButton,
  Typography,
  Stack,
  Chip,
  Collapse,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Upload as UploadIcon,
  Storage as StorageIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useState, useEffect } from 'react';

const FeatureAnnouncement = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    // Check if user has already dismissed this announcement
    const dismissed = localStorage.getItem('feature-announcement-dismissed');
    if (dismissed) {
      setIsVisible(false);
      setIsOpen(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('feature-announcement-dismissed', 'true');
    setIsOpen(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <Collapse in={isOpen}>
      <Box sx={{ mb: 3 }}>
        <Alert
          severity="info"
          icon={<InfoIcon />}
          sx={{
            backgroundColor: alpha(theme.palette.info.main, 0.1),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: theme.palette.info.main
            }
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleDismiss}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold', mb: 2 }}>
            🎉 Cập nhật mới: Giao diện Dashboard được cải tiến!
          </Typography>
         
           <Stack spacing={2}>
            <Typography variant="body2">
              Chúng tôi đã nâng cấp Dashboard với những tính năng mới để cải thiện trải nghiệm của bạn:
            </Typography>
            
            <Stack spacing={1.5} sx={{ pl: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <UploadIcon sx={{ color: theme.palette.primary.main, fontSize: 20, mt: 0.2 }} />
                <Typography variant="body2">
                  <strong>Tải lên dữ liệu dễ dàng:</strong> Hỗ trợ upload file PDF, TXT, CSV, JSON
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <StorageIcon sx={{ color: theme.palette.success.main, fontSize: 20, mt: 0.2 }} />
                <Typography variant="body2">
                  <strong>Quản lý dữ liệu tập trung:</strong> Xem, chỉnh sửa và quản lý tất cả tài liệu
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Chip 
                  label="Đã bỏ" 
                  size="small" 
                  color="error" 
                  variant="outlined"
                  sx={{ mt: 0.2 }}
                />
                <Typography variant="body2">
                  Chat widget đã được loại bỏ để tập trung vào quản lý dữ liệu
                </Typography>
              </Box>
            </Stack>
            
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                mt: 2,
                fontStyle: 'italic'
              }}
            >
              Khám phá trang <strong>"Quản lý dữ liệu"</strong> trong menu để trải nghiệm các tính năng mới!
            </Typography>
          </Stack>
        </Alert>
      </Box>
    </Collapse>
  );
};

export default FeatureAnnouncement;