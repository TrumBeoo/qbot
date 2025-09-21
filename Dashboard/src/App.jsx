// src/App.jsx
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';

// Components
import LoginPage from './components/auth/Login';
import DashboardPage from './components/dashboard/Dashboard';
import AnalyticsPage from './components/analytics/AnalyticsWithCharts';
import ProfilePage from './components/profile/Profile';
import ServicesPage from './components/services/Services';
import AddService from './components/services/AddService';
import EditService from './components/services/EditService';
import DataFileManagement from './components/data/DataFileManagement';
import ImageManagement from './components/images/ImageManagement';
import PlaceholderPage from './components/common/PlaceholderPage';

// MUI theme customization
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  return (
    <ChakraProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ServicesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AnalyticsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/data-files"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DataFileManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/images"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ImageManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/services/add"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AddService />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/services/edit/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EditService />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 page - fallback to dashboard for now */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ChakraProvider>
  );
}

export default App;