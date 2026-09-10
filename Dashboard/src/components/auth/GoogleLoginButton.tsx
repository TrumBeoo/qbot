// src/components/auth/GoogleLoginButton.jsx
import { Button, Icon, useToast } from '@chakra-ui/react';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = ({ variant = "outline", width = "100%" }) => {
  const { googleLogin, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleGoogleLogin = async () => {
    try {
      // Check if Google Client ID is configured
      if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        toast({
          title: 'Lỗi cấu hình',
          description: 'Google Client ID chưa được cấu hình',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Load Google Identity Services
      if (!window.google) {
        toast({
          title: 'Lỗi',
          description: 'Google Identity Services chưa được tải',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const result = await googleLogin(response.credential);
            if (result.success) {
              toast({
                title: 'Thành công',
                description: 'Đăng nhập Google thành công!',
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
              navigate('/dashboard');
            } else {
              toast({
                title: 'Lỗi',
                description: result.error || 'Đăng nhập Google thất bại',
                status: 'error',
                duration: 3000,
                isClosable: true,
              });
            }
          } catch (error) {
            toast({
              title: 'Lỗi',
              description: 'Có lỗi xảy ra khi đăng nhập',
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
          }
        }
      });

      // Prompt the user to select an account
      window.google.accounts.id.prompt();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể khởi tạo Google Login',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Button
      variant={variant}
      width={width}
      leftIcon={<Icon as={FaGoogle} color="red.500" />}
      onClick={handleGoogleLogin}
      isLoading={loading}
      loadingText="Đang đăng nhập..."
    >
      Google
    </Button>
  );
};

export default GoogleLoginButton;