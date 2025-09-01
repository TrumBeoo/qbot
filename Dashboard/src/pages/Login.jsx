// src/pages/Login.jsx
import { Box, Container, useColorModeValue } from '@chakra-ui/react';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <Box
      minH="100vh"
      bg={useColorModeValue('gray.50', 'gray.900')}
      display="flex"
      alignItems="center"
    >
      <Container maxW="lg" py="12">
        <LoginForm />
      </Container>
    </Box>
  );
};

export default LoginPage;