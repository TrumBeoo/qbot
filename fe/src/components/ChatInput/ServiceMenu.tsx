import React, { memo } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  IconButton,
  useColorModeValue,
  Portal
} from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import ServiceToolbar from './ServiceToolbar';
import { useClickOutside } from '../../hooks/useClickOutside';
import type { ServicesByCategory } from '../../types/api';

interface ServiceMenuProps {
  showServiceToolbar: boolean;
  servicesByCategory: ServicesByCategory;
  onServiceClick: (serviceKey: string) => void;
  onServiceSelect: (serviceKey: string, suggestion: string) => void;
  onToggle: () => void;
  onClose: () => void;
  textColor: string;
}

const ServiceMenu = memo<ServiceMenuProps>(({
  showServiceToolbar,
  servicesByCategory,
  onServiceClick,
  onServiceSelect,
  onToggle,
  onClose,
  textColor
}) => {
  const clickOutsideRef = useClickOutside(onClose);

  return (
    <Menu isOpen={showServiceToolbar} onClose={onClose}>
      <MenuButton
        as={IconButton}
        icon={<FaPlus />}
        size="sm"
        variant="ghost"
        aria-label="more"
        borderRadius="full"
        mr={2}
        color={textColor}
        _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
        onClick={onToggle}
      />
      {showServiceToolbar && (
        <Portal>
          <MenuList 
            ref={clickOutsideRef}
            p={2} 
            minW="320px"
            maxH="80vh"
            overflowY="auto"
            zIndex={1500}
          >
            <ServiceToolbar
              servicesByCategory={servicesByCategory}
              onServiceClick={onServiceClick}
              onServiceSelect={onServiceSelect}
            />
          </MenuList>
        </Portal>
      )}
    </Menu>
  );
});

ServiceMenu.displayName = 'ServiceMenu';

export default ServiceMenu;