// src/components/common/PlaceholderPage.jsx
import { Container, Typography, Box, Paper } from '@mui/material';

const PlaceholderPage = ({ title = "Trang đang phát triển", description = "Tính năng này đang được phát triển." }) => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      </Paper>
    </Container>
  );
};

export default PlaceholderPage;