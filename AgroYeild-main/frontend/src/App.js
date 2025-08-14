import React from 'react';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import theme from './theme';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import CreateProject from './pages/CreateProject';
import VerifyProject from './pages/VerifyProject';
import Governance from './pages/Governance';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Web3Provider>
        <Box minH="100vh" display="flex" flexDirection="column">
          <Navbar />
          <Box flex="1" py={8}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/create-project" element={<CreateProject />} />
              <Route path="/verify-project" element={<VerifyProject />} />
              <Route path="/governance" element={<Governance />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </Web3Provider>
    </ChakraProvider>
  );
}

export default App;
