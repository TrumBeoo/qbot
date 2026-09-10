// frontend/src/components/WelcomeScreen/WelcomeScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Button,
  Text,
  ScaleFade,
} from '@chakra-ui/react';
import { FaLanguage, FaPlay } from 'react-icons/fa';
import Lottie from 'lottie-react';
import chatbotAnimation from '../../animations/chatbot.json';
import { translations } from '../../constants';
import { slideUp, pulse } from '../../styles/animations';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

interface WelcomeScreenProps {
  language: string;
  onStart: () => void;
  onLanguageChange: () => void;
  /**
   * TUY CHON: cac cho goi deu boc trong `if (playWelcomeSound)`.
   * App.tsx hien KHONG truyen prop nay, nghia la am chao mung khong bao gio
   * phat. Khong phai loi TypeScript sinh ra - no chi lo cai da co.
   */
  playWelcomeSound?: () => void;
  /** App.tsx truyen them 5 prop nay nhung component khong dung tới. */
  onRegister?: unknown;
  onLogin?: unknown;
  onSocialLogin?: unknown;
  onLogout?: unknown;
  user?: unknown;
}

const WelcomeScreen = ({ 
  language, 
  onStart, 
  onLanguageChange, 
  playWelcomeSound
}: WelcomeScreenProps) => {
  const [showGreeting, setShowGreeting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreeting(true);
      if (playWelcomeSound) {
        playWelcomeSound();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [playWelcomeSound]);

  const handleStart = useCallback(() => {
    if (playWelcomeSound) {
      playWelcomeSound();
    }
    setTimeout(() => {
      onStart();
    }, 300);
  }, [onStart, playWelcomeSound]);

  return (
    <Box
      minH="100vh"
      bgImage="url('/img/bg.png')" 
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      overflow="hidden"
    >
      <Container maxW="container.md" textAlign="center" color="white" px={6}>
        <VStack spacing={8} animation={`${String(slideUp)} 0.8s ease-out`}>
          {/* Top Navigation */}
          <HStack position="absolute" top={4} right={4} spacing={2}>
            <ThemeToggle 
              size="sm"
              bg="blackAlpha.500"
              color="white"
              _hover={{
                bg: 'whiteAlpha.200',
                transform: 'translateY(-1px)'
              }}
              _active={{ transform: 'translateY(0)' }}
              transition="all 0.2s"
            />
            
            <Button
              leftIcon={<FaLanguage />}
              onClick={onLanguageChange}
              colorScheme="whiteAlpha"
              bg="blackAlpha.500"
              variant="solid"
              size="sm"
              color="white"
              borderColor="whiteAlpha.400"
              _hover={{
                borderColor: 'whiteAlpha.600',
                bg: 'whiteAlpha.200',
                transform: 'translateY(-1px)'
              }}
              _active={{ transform: 'translateY(0)' }}
              transition="all 0.2s"
            >
              {translations[language]?.languageSwitch || "Switch Language"}
            </Button>
          </HStack>

          {/* Bot Avatar */}
          <Box mt={-20} position="relative">
            <Lottie 
              animationData={chatbotAnimation}
              loop={true}
              autoplay={true}
              style={{ width: 300, height: 300 }}
            />
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w="200px"
              h="200px"
              bg="radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)"
              borderRadius="50%"
              animation={`${String(pulse)} 3s ease-in-out infinite`}
              zIndex={-1}
            />
          </Box>

          {/* Greeting */}
          <ScaleFade in={showGreeting} initialScale={0.9}>
            <Box
              bg="whiteAlpha.200"
              backdropFilter="blur(10px)"
              borderRadius="2xl"
              mt={-20}
              p={6}
              px={8}
              border="1px solid"
              borderColor="whiteAlpha.300"
              position="relative"
              maxW="md"
            >
              <Text
                fontSize={{ base: 'xl', md: '2xl' }}
                fontWeight="bold"
                mb={2}
              >
                {translations[language]?.welcomeGreeting || "Hello! I'm QBot AI, your travel assistant!"}
              </Text>
              
              <Box
                position="absolute"
                bottom="-10px"
                left="50%"
                transform="translateX(-50%)"
                w="0"
                h="0"
                borderLeft="15px solid transparent"
                borderRight="15px solid transparent"
                borderTop="15px solid"
                borderTopColor="whiteAlpha.200"
              />
            </Box>
          </ScaleFade>

          {/* Description */}
          <Box
            maxW="600px"
            mt={-2}
            // animationDelay va animationFillMode KHONG phai style prop
            // cua Chakra - chung bi bo am tham nen delay chua tung co
            // tac dung. Gop vao shorthand `animation` theo dung thu tu
            // CSS: name duration timing-function delay fill-mode.
            animation={`${String(slideUp)} 1.2s ease-out 0.8s both`}
          >
            <Text
              fontSize={{ base: 'lg', md: '2xl' }}
              opacity={0.9}
              lineHeight="1.6"
              textAlign="center"
              fontWeight="500"
            >
              {translations[language]?.welcomeDescription || 
               "I'll help you discover amazing destinations, find great restaurants, and plan your perfect trip in Quảng Ninh!"}
            </Text>
          </Box>

          {/* Action Buttons */}
          <VStack
            spacing={4}
            // animationDelay va animationFillMode KHONG phai style prop
            // cua Chakra - chung bi bo am tham nen delay chua tung co
            // tac dung. Gop vao shorthand `animation` theo dung thu tu
            // CSS: name duration timing-function delay fill-mode.
            animation={`${String(slideUp)} 1.6s ease-out 1.2s both`}
          >
            <Button
              size="lg"
              colorScheme="blue"
              bg="blue.500"
              color="white"
              border="2px solid"
              borderColor="blue.400"
              borderRadius="full"
              px={10}
              py={6}
              fontSize={{ base: 'md', md: 'lg' }}
              fontWeight="bold"
              leftIcon={<FaPlay />}
              onClick={handleStart}
              _hover={{
                bg: 'blue.600',
                borderColor: 'blue.300',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(66, 153, 225, 0.3)',
              }}
              _active={{
                transform: 'translateY(0)',
              }}
              transition="all 0.3s ease"
              boxShadow="0 4px 15px rgba(66, 153, 225, 0.2)"
            >
              {translations[language]?.tryButton || "Try Now"}
            </Button>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default WelcomeScreen;