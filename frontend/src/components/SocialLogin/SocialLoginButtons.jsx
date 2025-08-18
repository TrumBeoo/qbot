// frontend/src/components/SocialLogin/SocialLoginButtons.jsx
import React, { useCallback, useEffect } from 'react';
import {
  VStack,
  Button,
  Text,
  useToast,
} from '@chakra-ui/react';
import { translations } from '../../constants';

const SocialLoginButtons = ({
  onGoogleSuccess,
  onFacebookSuccess,
  onError,
  language,
  isLoading = false,
}) => {
  const toast = useToast();

  // Load Google Sign-In script
    useEffect(() => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Load Facebook SDK
  useEffect(() => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
    };

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleLogin = useCallback(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: onGoogleSuccess
      });
      
      // Create a temporary div for the Google button
      const buttonDiv = document.createElement('div');
      document.body.appendChild(buttonDiv);
      
      window.google.accounts.id.renderButton(buttonDiv, {
        theme: 'outline',
        size: 'large',
        width: '100%'
      });
      
      // Trigger click on the rendered button
      setTimeout(() => {
        const googleButton = buttonDiv.querySelector('div[role="button"]');
        if (googleButton) {
          googleButton.click();
        }
        document.body.removeChild(buttonDiv);
      }, 100);
    } else {
      toast({
        title: 'Error',
        description: 'Google Sign-In not loaded',
        status: 'error',
        duration: 3000,
      });
    }
  }, [onGoogleSuccess, toast]);

  const handleFacebookLogin = useCallback(() => {
    if (window.FB) {
      window.FB.login((response) => {
        if (response.authResponse) {
          onFacebookSuccess(response.authResponse);
        } else {
          onError('Facebook login cancelled');
        }
      }, { scope: 'email,public_profile' });
    } else {
      toast({
        title: 'Error',
        description: 'Facebook SDK not loaded',
        status: 'error',
        duration: 3000,
      });
    }
  }, [onFacebookSuccess, onError, toast]);

  return (
    <VStack spacing={3} width="100%">
      {/* Google Login Button */}
      <Button
        width="100%"
        size="lg"
        variant="outline"
        borderColor="gray.300"
        fontFamily="Inter"
        bg="white"
        color="gray.700"
        fontWeight="medium"
        isLoading={isLoading}
        onClick={handleGoogleLogin}
        leftIcon={
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt='Google'
            width="20"
            height="20"
          />
        }
        _hover={{ bg: 'gray.50' }}
      >
        {translations[language]?.loginWithGoogle || 'Continue with Google'}
      </Button>

      {/* Facebook Login Button */}
      <Button
        leftIcon={
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"
            alt="Facebook"
            width="20"
            height="20"
          />
        }
        variant="outline"
        size="lg"
        width="100%"
        onClick={handleFacebookLogin}
        isLoading={isLoading}
        borderColor="#1877F2"
        color="#1877F2"
        bg="white"
        fontWeight="medium"
        _hover={{ bg: 'blue.50' }}
      >
        {translations[language]?.loginWithFacebook || 'Continue with Facebook'}
      </Button>
    </VStack>
  );
};

export default SocialLoginButtons;