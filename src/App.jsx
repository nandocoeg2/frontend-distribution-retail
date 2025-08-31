import React from 'react';

import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';

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
import Customers from './pages/Customers.jsx';
import Suppliers from './pages/Suppliers.jsx';

import NotFound from './pages/NotFound.jsx';

import ProtectedRoute from './components/ProtectedRoute.jsx';

import authService from './services/authService';

const App = () => {
  return (
    <Router>
      <div className='App'>
        <ToastContainer
          position='bottom-right'
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme='light'
        />
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
          <Route
            path='/master/customers'
            element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path='/master/suppliers'
            element={
              <ProtectedRoute>
                <Suppliers />
              </ProtectedRoute>
            }
          />
          <Route path='/' element={<Navigate to='/dashboard' replace />} />
          <Route path='*' element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
