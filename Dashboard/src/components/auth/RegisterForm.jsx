// src/components/auth/RegisterForm.jsx
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
  Select,
  Textarea,
  VStack,
  HStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Link,
  Divider,
  Grid,
  GridItem,
  useColorModeValue,
  Checkbox,
  Progress,
  Spinner
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../../context/AuthContext';

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Nhà hàng/Quán ăn' },
  { value: 'hotel', label: 'Khách sạn/Homestay' },
  { value: 'transport', label: 'Dịch vụ vận chuyển' },
  { value: 'tourism', label: 'Điểm du lịch' },
  { value: 'tour', label: 'Tour du lịch' },
  { value: 'other', label: 'Khác' }
];

const CITIES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Hạ Long', 'Sapa', 'Hội An', 'Nha Trang', 'Đà Lạt', 'Phú Quốc'
];

const RegisterForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Bước 1: Thông tin tài khoản
    email: '',
    password: '',
    confirmPassword: '',
    
    // Bước 2: Thông tin doanh nghiệp
    businessName: '',
    businessType: '',
    description: '',
    address: '',
    city: '',
    district: '',
    phone: '',
    
    // Điều khoản
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Xóa error khi user bắt đầu nhập
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa chữ hoa, chữ thường và số';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.businessName) {
      newErrors.businessName = 'Tên doanh nghiệp là bắt buộc';
    }
    
    if (!formData.businessType) {
      newErrors.businessType = 'Vui lòng chọn loại hình kinh doanh';
    }
    
    if (!formData.address) {
      newErrors.address = 'Địa chỉ là bắt buộc';
    }
    
    if (!formData.city) {
      newErrors.city = 'Vui lòng chọn thành phố';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Vui lòng đồng ý với điều khoản sử dụng';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    const result = await register(formData);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    return strength;
  };

  const getPasswordStrengthColor = () => {
    const strength = getPasswordStrength();
    if (strength < 50) return 'red';
    if (strength < 75) return 'yellow';
    return 'green';
  };

  const getPasswordStrengthText = () => {
    const strength = getPasswordStrength();
    if (strength < 50) return 'Yếu';
    if (strength < 75) return 'Trung bình';
    return 'Mạnh';
  };

  return (
    <Box
      maxWidth="500px"
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
            Đăng ký tài khoản
          </Heading>
          <Text color="gray.600">
            Tham gia cộng đồng nhà cung cấp dịch vụ
          </Text>
        </VStack>

        {/* Progress Bar */}
        <Box width="100%">
          <HStack justify="space-between" mb="2">
            <Text fontSize="sm" color="gray.600">
              Bước {step} / 2
            </Text>
            <Text fontSize="sm" color="gray.600">
              {step === 1 ? 'Thông tin tài khoản' : 'Thông tin doanh nghiệp'}
            </Text>
          </HStack>
          <Progress value={step * 50} colorScheme="blue" borderRadius="md" />
        </Box>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {step === 1 && (
            <VStack spacing="4">
              <FormControl isInvalid={errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
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
                {formData.password && (
                  <VStack align="stretch" spacing="1" mt="2">
                    <Progress
                      value={getPasswordStrength()}
                      colorScheme={getPasswordStrengthColor()}
                      size="sm"
                      borderRadius="sm"
                    />
                    <Text fontSize="xs" color="gray.600">
                      Độ mạnh: {getPasswordStrengthText()}
                    </Text>
                  </VStack>
                )}
                {errors.password && (
                  <Text color="red.500" fontSize="sm" mt="1">
                    {errors.password}
                  </Text>
                )}
              </FormControl>

              <FormControl isInvalid={errors.confirmPassword}>
                <FormLabel>Xác nhận mật khẩu</FormLabel>
                <InputGroup>
                  <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu"
                    focusBorderColor="blue.500"
                  />
                  <InputRightElement>
                    <Button
                      variant="ghost"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      size="sm"
                    >
                      {showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                {errors.confirmPassword && (
                  <Text color="red.500" fontSize="sm" mt="1">
                    {errors.confirmPassword}
                  </Text>
                )}
              </FormControl>

              <Button
                onClick={handleNextStep}
                colorScheme="blue"
                width="100%"
                size="lg"
              >
                Tiếp theo
              </Button>
            </VStack>
          )}

          {step === 2 && (
            <VStack spacing="4">
              <Grid templateColumns="repeat(2, 1fr)" gap="4" width="100%">
                <GridItem colSpan={2}>
                  <FormControl isInvalid={errors.businessName}>
                    <FormLabel>Tên doanh nghiệp</FormLabel>
                    <Input
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="VD: Nhà hàng ABC"
                      focusBorderColor="blue.500"
                    />
                    {errors.businessName && (
                      <Text color="red.500" fontSize="sm" mt="1">
                        {errors.businessName}
                      </Text>
                    )}
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isInvalid={errors.businessType}>
                    <FormLabel>Loại hình kinh doanh</FormLabel>
                    <Select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      placeholder="Chọn loại hình"
                      focusBorderColor="blue.500"
                    >
                      {BUSINESS_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </Select>
                    {errors.businessType && (
                      <Text color="red.500" fontSize="sm" mt="1">
                        {errors.businessType}
                      </Text>
                    )}
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isInvalid={errors.phone}>
                    <FormLabel>Số điện thoại</FormLabel>
                    <Input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0123 456 789"
                      focusBorderColor="blue.500"
                    />
                    {errors.phone && (
                      <Text color="red.500" fontSize="sm" mt="1">
                        {errors.phone}
                      </Text>
                    )}
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isInvalid={errors.city}>
                    <FormLabel>Thành phố</FormLabel>
                    <Select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Chọn thành phố"
                      focusBorderColor="blue.500"
                    >
                      {CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </Select>
                    {errors.city && (
                      <Text color="red.500" fontSize="sm" mt="1">
                        {errors.city}
                      </Text>
                    )}
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isInvalid={errors.district}>
                    <FormLabel>Quận/Huyện</FormLabel>
                    <Input
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      placeholder="VD: Quận 1"
                      focusBorderColor="blue.500"
                    />
                  </FormControl>
                </GridItem>

                <GridItem colSpan={2}>
                  <FormControl isInvalid={errors.address}>
                    <FormLabel>Địa chỉ cụ thể</FormLabel>
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Số nhà, tên đường"
                      focusBorderColor="blue.500"
                    />
                    {errors.address && (
                      <Text color="red.500" fontSize="sm" mt="1">
                        {errors.address}
                      </Text>
                    )}
                  </FormControl>
                </GridItem>

                <GridItem colSpan={2}>
                  <FormControl>
                    <FormLabel>Mô tả (tùy chọn)</FormLabel>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Mô tả ngắn về doanh nghiệp của bạn"
                      rows="3"
                      focusBorderColor="blue.500"
                    />
                  </FormControl>
                </GridItem>
              </Grid>

              <FormControl isInvalid={errors.acceptTerms}>
                <Checkbox
                  name="acceptTerms"
                  isChecked={formData.acceptTerms}
                  onChange={handleChange}
                  colorScheme="blue"
                >
                  <Text fontSize="sm">
                    Tôi đồng ý với{' '}
                    <Link color="blue.500" href="/terms">
                      Điều khoản sử dụng
                    </Link>{' '}
                    và{' '}
                    <Link color="blue.500" href="/privacy">
                      Chính sách bảo mật
                    </Link>
                  </Text>
                </Checkbox>
                {errors.acceptTerms && (
                  <Text color="red.500" fontSize="sm" mt="1">
                    {errors.acceptTerms}
                  </Text>
                )}
              </FormControl>

              <HStack spacing="4" width="100%">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  flex="1"
                  size="lg"
                >
                  Quay lại
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  flex="1"
                  size="lg"
                  isLoading={loading}
                  loadingText="Đang đăng ký..."
                  spinner={<Spinner size="sm" />}
                >
                  Đăng ký
                </Button>
              </HStack>
            </VStack>
          )}
        </form>

        {step === 1 && (
          <>
            <HStack width="100%">
              <Divider />
              <Text fontSize="sm" color="gray.500" px="2">
                Hoặc
              </Text>
              <Divider />
            </HStack>

          <Text fontSize="sm" color="gray.600">
              Đã có tài khoản?{' '}
              <Link
                as={RouterLink}
                to="/login"
                color="blue.500"
                fontWeight="semibold"
              >
                Đăng nhập ngay
              </Link>
            </Text>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default RegisterForm;