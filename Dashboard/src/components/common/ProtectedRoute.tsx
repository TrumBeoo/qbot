// src/components/common/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Spinner, Center } from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Center height="100vh">
        <Box textAlign="center">
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Box mt="4" fontSize="lg" color="gray.600">
            Đang kiểm tra quyền truy cập...
          </Box>
        </Box>
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;