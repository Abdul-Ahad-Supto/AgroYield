// frontend/src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Center, 
  Spinner, 
  Alert, 
  AlertIcon, 
  AlertTitle, 
  AlertDescription,
  Button,
  VStack
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Center h="50vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Box>Checking authentication...</Box>
        </VStack>
      </Center>
    );
  }

  // Redirect to auth page if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if KYC is required and completed
  if (user && !user.isKYCVerified && location.pathname !== '/kyc' && 
      user.email !== 'admin@agroyield.com' && user.email !== 'validator@agroyield.com') {
    return (
      <Center h="50vh">
        <Alert
          status="warning"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
          maxW="md"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            KYC Verification Required
          </AlertTitle>
          <AlertDescription maxW="sm" mb={4}>
            You need to complete KYC verification to access this feature.
          </AlertDescription>
          <Button colorScheme="brand" onClick={() => window.location.href = '/kyc'}>
            Complete KYC
          </Button>
        </Alert>
      </Center>
    );
  }

  // Check role-based access
  if (requiredRole) {
    const hasRequiredRole = () => {
      if (!user || !user.roles) return false;
      
      switch (requiredRole) {
        case 'farmer':
          return user.roles.includes('farmer');
        case 'investor':
          return user.roles.includes('investor');
        case 'admin':
          // Check if user is admin (you can add admin role to backend)
          return user.email === 'admin@agroyield.com' || user.roles.includes('admin');
        default:
          return true;
      }
    };

    if (!hasRequiredRole()) {
      return (
        <Center h="50vh">
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            borderRadius="lg"
            maxW="md"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Access Denied
            </AlertTitle>
            <AlertDescription maxW="sm" mb={4}>
              You don't have permission to access this page. 
              {requiredRole === 'farmer' && " You need to be verified as a farmer."}
              {requiredRole === 'investor' && " You need to be verified as an investor."}
              {requiredRole === 'admin' && " Admin access required."}
            </AlertDescription>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </Alert>
        </Center>
      );
    }
  }

  // Render the protected component
  return children;
};

export default ProtectedRoute;