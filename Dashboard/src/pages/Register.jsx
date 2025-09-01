// src/pages/Register.jsx
import { Box, Container, useColorModeValue } from '@chakra-ui/react';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage = () => {
  return (
    <Box
      minH="100vh"
      bg={useColorModeValue('gray.50', 'gray.900')}
      display="flex"
      alignItems="center"
    >
      <Container maxW="lg" py="12">
        <RegisterForm />
      </Container>
    </Box>
  );
};

export default RegisterPage;