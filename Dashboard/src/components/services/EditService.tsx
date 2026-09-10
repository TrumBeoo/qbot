// src/components/services/EditService.jsx
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const EditService = () => {
  const navigate = useNavigate();
  const { id } = useParams();

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
          Chỉnh sửa dịch vụ #{id}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Cập nhật thông tin dịch vụ du lịch
        </Typography>
      </Box>

      <Card elevation={1}>
        <CardContent sx={{ p: 4 }}>
          <Alert severity="info">
            <Typography variant="h6" component="div" gutterBottom>
              Tính năng đang phát triển
            </Typography>
            <Typography variant="body2">
              Trang chỉnh sửa dịch vụ đang được phát triển. Vui lòng quay lại sau.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Container>
  );
};

export default EditService;
