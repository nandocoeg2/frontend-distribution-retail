import React from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Analytics from './pages/Analytics.jsx';
import Users from './pages/Users.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';
import SettingProfile from './pages/SettingProfile.jsx';
import RoleManagement from './pages/RoleManagement.jsx';
import PurchaseOrders from './pages/PurchaseOrders.jsx';
import NotFound from './pages/NotFound.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import authService from './services/authService';

const App = () => {
  return (
    <Router>
      <div className='App'>
        <Routes>
          {/* Public Routes */}
          <Route
            path='/login'
            element={
              authService.isAuthenticated() ? (
                <Navigate to='/dashboard' replace />
              ) : (
                <Login />
              )
            }
          />
          <Route
            path='/register'
            element={
              authService.isAuthenticated() ? (
                <Navigate to='/dashboard' replace />
              ) : (
                <Register />
              )
            }
          />

          {/* Protected Routes */}
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path='/analytics'
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path='/users'
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path='/settings'
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path='/profile'
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path='/profile/settings-profile'
            element={
              <ProtectedRoute>
                <SettingProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path='/role-management'
            element={
              <ProtectedRoute>
                <RoleManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path='/purchase-orders'
            element={
              <ProtectedRoute>
                <PurchaseOrders />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route
            path='/'
            element={
              authService.isAuthenticated() ? (
                <Navigate to='/dashboard' replace />
              ) : (
                <Navigate to='/login' replace />
              )
            }
          />

          {/* 404 Page */}
          <Route path='*' element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
