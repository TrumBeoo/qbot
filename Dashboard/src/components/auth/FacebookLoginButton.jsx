// src/components/auth/FacebookLoginButton.jsx
import { Button, Icon, useToast } from '@chakra-ui/react';
import { FaFacebook } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { loadFacebookSDK } from '../../utils/facebookSDK';

const FacebookLoginButton = ({ variant = "outline", width = "100%" }) => {
  const { facebookLogin, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleFacebookLogin = async () => {
    try {
      // Load Facebook SDK
      const FB = await loadFacebookSDK();

      FB.login(async (response) => {
        if (response.authResponse) {
          try {
            const result = await facebookLogin(response.authResponse.accessToken);
            if (result.success) {
              toast({
                title: 'Thành công',
                description: 'Đăng nhập Facebook thành công!',
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
              navigate('/dashboard');
            } else {
              toast({
                title: 'Lỗi',
                description: result.error || 'Đăng nhập Facebook thất bại',
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
        } else {
          toast({
            title: 'Thông báo',
            description: 'Đăng nhập Facebook đã bị hủy',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
        }
      }, { scope: 'email' });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể khởi tạo Facebook Login',
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
      leftIcon={<Icon as={FaFacebook} color="blue.600" />}
      onClick={handleFacebookLogin}
      isLoading={loading}
      loadingText="Đang đăng nhập..."
    >
      Facebook
    </Button>
  );
};

export default FacebookLoginButton;