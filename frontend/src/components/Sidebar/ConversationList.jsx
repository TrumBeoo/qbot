// src/components/Sidebar/ConversationList.jsx
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Tooltip,
  useColorModeValue,
  Input,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
} from '@chakra-ui/react';
import { FaTrash, FaComment, FaEdit, FaEllipsisV } from 'react-icons/fa';
import { translations } from '../../constants';
import { useState } from 'react';

const ConversationItem = ({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
  language,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title || '');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue(
    isActive ? 'blue.50' : 'transparent',
    isActive ? 'blue.900' : 'transparent'
  );
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue(
    isActive ? 'blue.200' : 'transparent',
    isActive ? 'blue.600' : 'transparent'
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return translations[language].today || 'Hôm nay';
    } else if (diffDays === 2) {
      return translations[language].yesterday || 'Hôm qua';
    } else if (diffDays <= 7) {
      return `${diffDays} ${translations[language].daysAgo || 'ngày trước'}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Box
      p={3}
      cursor="pointer"
      bg={bgColor}
      borderLeftWidth="3px"
      borderLeftColor={borderColor}
      _hover={{ bg: hoverBgColor }}
      onClick={() => onSelect(conversation.id)}
      transition="all 0.2s"
    >
      <HStack spacing={3} align="start">
        <FaComment color={isActive ? '#3182CE' : '#A0AEC0'} />
        <VStack align="start" spacing={1} flex="1" minW="0">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => {
                if (editTitle.trim() && editTitle !== conversation.title) {
                  onRename(conversation._id, editTitle.trim());
                }
                setIsEditing(false);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (editTitle.trim() && editTitle !== conversation.title) {
                    onRename(conversation._id, editTitle.trim());
                  }
                  setIsEditing(false);
                }
              }}
              size="sm"
              fontSize="sm"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <Text
              fontSize="sm"
              fontWeight={isActive ? 'semibold' : 'medium'}
              color={isActive ? 'blue.600' : 'gray.800'}
              isTruncated
              maxW="full"
            >
              {conversation.title || translations[language].newConversation || 'Cuộc trò chuyện mới'}
            </Text>
          )}
          <Text fontSize="xs" color="gray.500">
            {formatDate(conversation.updated_at)}
          </Text>
          {conversation.message_count > 0 && (
            <Text fontSize="xs" color="gray.400">
              {conversation.message_count} {translations[language].messages || 'tin nhắn'}
            </Text>
          )}
        </VStack>
        <Menu isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
          <MenuButton
            as={IconButton}
            icon={<FaEllipsisV />}
            size="xs"
            variant="ghost"
            onClick={(e) => e.stopPropagation()}
            opacity={0.7}
            _hover={{ opacity: 1 }}
          />
          <MenuList>
            <MenuItem
              icon={<FaEdit />}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
                onClose();
              }}
            >
              {translations[language].rename || 'Đổi tên'}
            </MenuItem>
            <MenuItem
              icon={<FaTrash />}
              color="red.500"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conversation._id);
                onClose();
              }}
            >
              {translations[language].delete || 'Xóa'}
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Box>
  );
};

const ConversationList = ({
  conversations,
  currentConversation,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  language,
}) => {
  if (!conversations || conversations.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.500" fontSize="sm">
          {translations[language].noConversations || 'Chưa có cuộc trò chuyện nào'}
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={0} align="stretch">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation._id}
          conversation={conversation}
          isActive={currentConversation?._id === conversation._id}
          onSelect={onSelectConversation}
          onDelete={onDeleteConversation}
          onRename={onRenameConversation}
          language={language}
        />
      ))}
    </VStack>
  );
};

export default ConversationList;