// src/components/MessageBubble/MessageBubble.jsx
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  IconButton,
  Spinner,
  useColorModeValue,
  Code,
  Textarea,
  Image,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import '../../App.css';
import {
  FaCopy,
  FaThumbsUp,
  FaThumbsDown,
  FaRobot,
  FaUser,
} from 'react-icons/fa';
import { useState } from 'react';
import { translations } from '../../constants';
import TypingText from '../Typing/TypingText';


const MessageBubble = ({ message, language, config }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isUser = message.sender === 'user';
  const isNewMessage = message.timestamp && (Date.now() - new Date(message.timestamp).getTime()) < 5000 && !hasTyped && message.sender === 'bot';
  
  // Debug log
  console.log('🔍 MessageBubble render:', {
    sender: message.sender,
    hasImages: !!message.images,
    imageCount: message.images?.length || 0,
    isNewMessage,
    hasTyped,
    showActions,
    messageId: message.id
  });
  
  // Additional debug for images
  if (message.images && message.images.length > 0) {
    console.log('🖼️ Images in message:', message.images.map(img => ({ url: img.url, caption: img.caption })));
  }
  
  // User message colors (keep original bubble design)
  const userBgColor = useColorModeValue('blue.500', 'blue.600');
  const userTextColor = 'white';
  
  // Bot message colors (textarea-like design)
  const botBgColor = useColorModeValue('', '');
  const botTextColor = useColorModeValue('gray.800', 'gray.100');
  const botBorderColor = useColorModeValue('gray.200', 'gray.600');
  const botHoverBorderColor = useColorModeValue('gray.300', 'gray.500');
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    onOpen();
  };

  const renderImages = (images) => {
    console.log('🎨 MessageBubble renderImages called with:', images);
    if (!images || images.length === 0) {
      console.log('❌ No images to render');
      return null;
    }

    console.log('✅ Rendering', images.length, 'images');
    
    // Determine grid layout class based on image count
    let gridClass = 'single';
    if (images.length === 2) gridClass = 'double';
    else if (images.length === 3) gridClass = 'triple';
    else if (images.length >= 4) gridClass = 'quad';
    
    return (
      <Box mt={3}>
        <Box className={`message-images ${gridClass}`}>
          {images.slice(0, 4).map((image, index) => (
            <Box key={index} position="relative">
              <Image
                src={image.url}
                alt={image.alt || `Image ${index + 1}`}
                className="message-image"
                onClick={() => handleImageClick(image.url)}
                loading="lazy"
              />
              {image.caption && (
                <Text
                  fontSize="xs"
                  color="gray.600"
                  mt={1}
                  textAlign="center"
                >
                  {image.caption}
                </Text>
              )}
            </Box>
          ))}
        </Box>
        {images.length > 4 && (
          <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
            +{images.length - 4} more images
          </Text>
        )}
      </Box>
    );
  };

  const formatMessageText = (text) => {
    // Handle code blocks
    if (text.includes('```')) {
      const parts = text.split('```');
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <Code
              key={index}
              display="block"
              whiteSpace="pre-wrap"
              p={3}
              my={2}
              bg={useColorModeValue('gray.100', 'gray.700')}
              borderRadius="md"
              fontSize="sm"
            >
              {part}
            </Code>
          );
        }
        return <Text key={index}>{part}</Text>;
      });
    }
    return text;
  };

  // Render user message with original bubble design
  if (isUser) {
    return (
      <HStack
        align="start"
        justify="flex-end"
        spacing={3}
        w="full"
        mb={4}
      >
        <VStack align="flex-end" spacing={2} maxW="70%">
          <Box
            bg={userBgColor}
            color={userTextColor}
            px={4}
            py={3}
            borderRadius="lg"
            borderBottomRightRadius="sm"
            boxShadow="sm"
            position="relative"
            minW="100px"
          >
            <Box fontSize="md" lineHeight="1.6">
              {formatMessageText(message.text)}
            </Box>
          </Box>
        </VStack>
      </HStack>
    );
  }

  // Render bot message with Claude-like textarea design
  return (
    <VStack spacing={3} w="full" align="stretch" mb={5}>
      <HStack align="start" spacing={3} w="full">
        <VStack align="stretch" spacing={2} flex="1" maxW="calc(100% - 60px)">
          {message.isLoading ? (
            <Box
              bg={botBgColor}
              border="none"
              borderColor={botBorderColor}
              borderRadius="md"
              p={4}
              minH="100px"
            >
              <HStack spacing={2} align="center">
                <Spinner size="sm" color="blue.500" />
                <Text fontSize="sm" color={botTextColor}>{message.text}</Text>
              </HStack>
            </Box>
          ) : (
            <Box
              bg={botBgColor}
              border="none"
              borderColor={botBorderColor}
              borderRadius="xl"
              p={0}
              position="relative"
              _hover={{
                borderColor: botHoverBorderColor
              }}
              transition="border-color 0.2s"
              overflow="hidden"
            >
              {/* Always show images first */}
              {message.images && message.images.length > 0 && (
                <Box px={4} pt={3} pb={message.text ? 2 : 3}>
                  {renderImages(message.images)}
                </Box>
              )}
              
              {/* Then show text content */}
              {message.text && (
                message.text.includes('```') ? (
                  <Box fontSize="sm" lineHeight="1.6" color={botTextColor} p={4}>
                    {formatMessageText(message.text)}
                  </Box>
                ) : isNewMessage ? (
                  <Box px={4} py={3}>
                    <TypingText
                      text={message.text}
                      speed={15}
                      color={botTextColor}
                      onDone={() => {
                        setShowActions(true);
                        setHasTyped(true);
                      }}
                    />
                  </Box>
                ) : (
                  <Text
                    whiteSpace="pre-wrap"
                    color={botTextColor}
                    fontSize="md"
                    lineHeight="1.6"
                    fontFamily="inherit"
                    px={4}
                    py={3}
                  >
                    {message.text}
                  </Text>
                )
              )}
            </Box>
          )}

          {/* Message Actions */}
          {!message.isLoading && (showActions || !isNewMessage) && (
            <HStack spacing={1} justify="flex-start" opacity={0.7} _hover={{ opacity: 1 }}>
              <IconButton
                icon={isCopied ? <FaThumbsUp /> : <FaCopy />}
                ml="10px"
                size="xs"
                variant="ghost"
                onClick={handleCopy}
                isDisabled={isCopied}
                aria-label={translations[language]?.copyMessage || 'Copy message'}
                title={isCopied ? 'Copied!' : 'Copy'}
                color={botTextColor}
                _hover={{
                  bg: useColorModeValue('gray.100', 'gray.700')
                }}
              />
              
              <IconButton
                icon={<FaThumbsUp />}
                size="xs"
                variant="ghost"
                aria-label="Like"
                color={botTextColor}
                _hover={{
                  bg: useColorModeValue('gray.100', 'gray.700')
                }}
              />
              
              <IconButton
                icon={<FaThumbsDown />}
                size="xs"
                variant="ghost"
                aria-label="Dislike"
                color={botTextColor}
                _hover={{
                  bg: useColorModeValue('gray.100', 'gray.700')
                }}
              />
            </HStack>
          )}
        </VStack>
      </HStack>

      {/* Image Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={0}>
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Enlarged view"
                w="full"
                h="auto"
                borderRadius="md"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default MessageBubble;