// src/components/auth/LoginForm.jsx
import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  HStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Link,
  Divider,
  useColorModeValue,
  Icon,
  Spinner
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Xóa error khi user bắt đầu nhập
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await login(formData);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <Box
      maxWidth="400px"
      mx="auto"
      mt="8"
      p="8"
      bg={bgColor}
      borderRadius="lg"
      boxShadow="xl"
      border="1px"
      borderColor={borderColor}
    >
      <VStack spacing="6">
        <VStack spacing="2" textAlign="center">
          <Heading size="lg" color="blue.600">
            Đăng nhập
          </Heading>
          <Text color="gray.600">
            Chào mừng bạn quay trở lại!
          </Text>
        </VStack>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <VStack spacing="4">
            <FormControl isInvalid={errors.email}>
              <FormLabel>Email</FormLabel>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập email của bạn"
                focusBorderColor="blue.500"
              />
              {errors.email && (
                <Text color="red.500" fontSize="sm" mt="1">
                  {errors.email}
                </Text>
              )}
            </FormControl>

            <FormControl isInvalid={errors.password}>
              <FormLabel>Mật khẩu</FormLabel>
              <InputGroup>
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  focusBorderColor="blue.500"
                />
                <InputRightElement>
                  <Button
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    size="sm"
                  >
                    {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              {errors.password && (
                <Text color="red.500" fontSize="sm" mt="1">
                  {errors.password}
                </Text>
              )}
            </FormControl>

            <HStack justify="space-between" width="100%">
              <Link
                as={RouterLink}
                to="/forgot-password"
                color="blue.500"
                fontSize="sm"
              >
                Quên mật khẩu?
              </Link>
            </HStack>

            <Button
              type="submit"
              colorScheme="blue"
              width="100%"
              size="lg"
              isLoading={loading}
              loadingText="Đang đăng nhập..."
              spinner={<Spinner size="sm" />}
            >
              Đăng nhập
            </Button>
          </VStack>
        </form>

        <HStack width="100%">
          <Divider />
          <Text fontSize="sm" color="gray.500" px="2">
            Hoặc
          </Text>
          <Divider />
        </HStack>

        <VStack spacing="3" width="100%">
          <Button
            variant="outline"
            width="100%"
            leftIcon={<Icon as={FaGoogle} color="red.500" />}
          >
            Google
          </Button>
          <Button
            variant="outline"
            width="100%"
            leftIcon={<Icon as={FaFacebook} color="blue.600" />}
          >
            Facebook
          </Button>
        </VStack>

        <Text fontSize="sm" color="gray.600">
          Chưa có tài khoản?{' '}
          <Link
            as={RouterLink}
            to="/register"
            color="blue.500"
            fontWeight="semibold"
          >
            Đăng ký ngay
          </Link>
        </Text>
      </VStack>
    </Box>
  );
};

export default LoginForm;