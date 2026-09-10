// src/components/services/AddService.jsx
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const AddService = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/services')}
          sx={{ mb: 2 }}
        >
          Quay lại danh sách dịch vụ
        </Button>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Thêm dịch vụ mới
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tạo dịch vụ du lịch mới cho hệ thống
        </Typography>
      </Box>

      <Card elevation={1}>
        <CardContent sx={{ p: 4 }}>
          <Alert severity="info">
            <Typography variant="h6" component="div" gutterBottom>
              Tính năng đang phát triển
            </Typography>
            <Typography variant="body2">
              Trang thêm dịch vụ mới đang được phát triển. Vui lòng quay lại sau.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AddService;
