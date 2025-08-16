import React from 'react';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Web3Provider } from './contexts/Web3Context';
import theme from './theme';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Authentication Components
import Auth from './pages/Auth';
import KYCForm from './pages/KYCForm';
import ProtectedRoute from './pages/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Governance from './pages/Governance';
import ProjectDetail from './pages/ProjectDetail';
import VerifyProject from './pages/VerifyProject';
import CreateProject from './pages/CreateProject';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import KYCDashboard from './pages/KYCDashboard';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Web3Provider>
          <Box minH="100vh" display="flex" flexDirection="column">
            <Navbar />
            <Box flex="1" py={8}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/kyc" element={
                  <ProtectedRoute>
                    <KYCForm />
                  </ProtectedRoute>
                } />
                
                <Route path="/projects" element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                } />
                
                <Route path="/projects/:id" element={
                  <ProtectedRoute>
                    <ProjectDetail />
                  </ProtectedRoute>
                } />
                
                <Route path="/create-project" element={
                  <ProtectedRoute requiredRole="farmer">
                    <CreateProject />
                  </ProtectedRoute>
                } />
                
                <Route path="/verify-project" element={
                  <ProtectedRoute requiredRole="admin">
                    <VerifyProject />
                  </ProtectedRoute>
                } />
                
                <Route path="/governance" element={
                  <ProtectedRoute>
                    <Governance />
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/kyc" element={
                  <ProtectedRoute requiredRole="admin">
                    <KYCDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Box>
            <Footer />
          </Box>
        </Web3Provider>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;