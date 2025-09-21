import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  useColorModeValue,
  HStack,
  Icon
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import googleMapsService from '../../services/googleMapsService';

const SearchSuggestions = ({ query, onSelect, isVisible }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (!query.trim() || !isVisible) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const predictions = await googleMapsService.getAutocompletePredictions(query);
        setSuggestions(predictions.slice(0, 5));
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, isVisible]);

  if (!isVisible || (!suggestions.length && !isLoading)) {
    return null;
  }

  return (
    <Box
      position="absolute"
      top="100%"
      left={0}
      right={0}
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="md"
      shadow="lg"
      zIndex={1000}
      maxH="300px"
      overflowY="auto"
    >
      <VStack spacing={0} align="stretch">
        {isLoading ? (
          <Box p={3}>
            <Text fontSize="sm" color="gray.500">Đang tìm kiếm...</Text>
          </Box>
        ) : (
          suggestions.map((suggestion, index) => (
            <Box
              key={suggestion.place_id || index}
              p={3}
              cursor="pointer"
              _hover={{ bg: hoverBg }}
              borderBottom={index < suggestions.length - 1 ? "1px" : "none"}
              borderColor={borderColor}
              onClick={() => onSelect(suggestion)}
            >
              <HStack spacing={3}>
                <Icon as={FaMapMarkerAlt} color="gray.500" />
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </Text>
                  <Text fontSize="xs" color="gray.500" noOfLines={1}>
                    {suggestion.structured_formatting?.secondary_text || ''}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
};

export default SearchSuggestions;