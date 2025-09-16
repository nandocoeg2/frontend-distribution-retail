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
import PurchaseOrderHistory from './pages/PurchaseOrderHistory.jsx';
import Customers from './pages/Customers.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Inventories from './pages/Inventories.jsx';
import Packings from './pages/Packings.jsx';
import Invoices from './pages/Invoices.jsx';
import SuratJalan from './pages/SuratJalan.jsx';
import TermOfPayments from './pages/TermOfPayments.jsx';
import GroupCustomers from './pages/GroupCustomers.jsx';
import Regions from './pages/Regions.jsx';
import Companies from './pages/Companies.jsx';
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
            path='/po/purchase-orders'
            element={
              <ProtectedRoute>
                <PurchaseOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path='/po/invoices'
            element={
              <ProtectedRoute>
                <Invoices />
              </ProtectedRoute>
            }
          />
          <Route
            path='/po/surat-jalan'
            element={
              <ProtectedRoute>
                <SuratJalan />
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
          <Route
            path='/master/inventories'
            element={
              <ProtectedRoute>
                <Inventories />
              </ProtectedRoute>
            }
          />
          <Route
            path='/master/term-of-payment'
            element={
              <ProtectedRoute>
                <TermOfPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path='/master/group-customer'
            element={
              <ProtectedRoute>
                <GroupCustomers />
              </ProtectedRoute>
            }
          />
          <Route
            path='/master/regions'
            element={
              <ProtectedRoute>
                <Regions />
              </ProtectedRoute>
            }
          />
          <Route
            path='/master/company'
            element={
              <ProtectedRoute>
                <Companies />
              </ProtectedRoute>
            }
          />
          <Route
            path='/po/packings'
            element={
              <ProtectedRoute>
                <Packings />
              </ProtectedRoute>
            }
          />
          <Route
            path='/po/purchase-orders-history'
            element={
              <ProtectedRoute>
                <PurchaseOrderHistory />
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
