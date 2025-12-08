import React from 'react';

import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { ToastContainer } from 'react-toastify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './hooks/useAuth';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Reporting from './pages/Reporting.jsx';
import Analytics from './pages/Analytics.jsx';
import Users from './pages/Users.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';
import SettingProfile from './pages/SettingProfile.jsx';
import RoleManagement from './pages/RoleManagement.jsx';
import PurchaseOrders from './pages/PurchaseOrders.jsx';
import BulkUploadHistory from './pages/BulkUploadHistory.jsx';
import PurchaseOrderHistory from './pages/PurchaseOrderHistory.jsx';
import Customers from './pages/Customers.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Items from './pages/Items.jsx';
import Packings from './pages/Packings.jsx';
import LaporanPenerimaanBarang from './pages/LaporanPenerimaanBarang.jsx';
import InvoicePengiriman from './pages/InvoicePengiriman.jsx';
import InvoicePenagihan from './pages/InvoicePenagihan.jsx';
import FakturPajak from './pages/FakturPajak.jsx';
import Kwitansi from './pages/Kwitansi.jsx';
import TandaTerimaFaktur from './pages/TandaTerimaFaktur.jsx';
import TandaTerimaFakturGrouped from './pages/TandaTerimaFakturGrouped.jsx';
import MutasiBank from './pages/MutasiBank.jsx';
import Returns from './pages/Returns.jsx';
import ReturnCreate from './pages/ReturnCreate.jsx';
import ReturnDetail from './pages/ReturnDetail.jsx';
import SuratJalan from './pages/SuratJalan.jsx';
import TermOfPayments from './pages/TermOfPayments.jsx';
import GroupCustomers from './pages/GroupCustomers.jsx';
import Companies from './pages/Companies.jsx';
import MasterParameter from './pages/MasterParameter.jsx';
import NotFound from './pages/NotFound.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CheckingList from './pages/CheckingList.jsx';
import StockMovements from './pages/StockMovements.jsx';
import ScheduledPrice from './pages/ScheduledPrice.jsx';

// Component untuk routes yang menggunakan useAuth
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path='/login'
        element={
          isAuthenticated ? <Navigate to='/reporting' replace /> : <Login />
        }
      />
      <Route
        path='/register'
        element={
          isAuthenticated ? <Navigate to='/reporting' replace /> : <Register />
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
        path='/reporting'
        element={
          <ProtectedRoute>
            <Reporting />
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
        path='/po/purchase-orders/bulk-history'
        element={
          <ProtectedRoute>
            <BulkUploadHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path='/po/invoice-pengiriman'
        element={
          <ProtectedRoute>
            <InvoicePengiriman />
          </ProtectedRoute>
        }
      />
      <Route
        path='/invoice/invoice-penagihan'
        element={
          <ProtectedRoute>
            <InvoicePenagihan />
          </ProtectedRoute>
        }
      />
      <Route
        path='/invoice/faktur-pajak'
        element={
          <ProtectedRoute>
            <FakturPajak />
          </ProtectedRoute>
        }
      />
      <Route
        path='/invoice/kwitansi'
        element={
          <ProtectedRoute>
            <Kwitansi />
          </ProtectedRoute>
        }
      />
      <Route
        path='/invoice/ttf-grouped'
        element={
          <ProtectedRoute>
            <TandaTerimaFakturGrouped />
          </ProtectedRoute>
        }
      />
      <Route
        path='/invoice/ttf'
        element={
          <ProtectedRoute>
            <TandaTerimaFaktur />
          </ProtectedRoute>
        }
      />
      <Route
        path='/invoice/mutasi-bank'
        element={
          <ProtectedRoute>
            <MutasiBank />
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
        path='/po/checking-list'
        element={
          <ProtectedRoute>
            <CheckingList />
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
        path='/master/items'
        element={
          <ProtectedRoute>
            <Items />
          </ProtectedRoute>
        }
      />
      <Route
        path='/master/stock-movements'
        element={
          <ProtectedRoute>
            <StockMovements />
          </ProtectedRoute>
        }
      />
      <Route
        path='/master/scheduled-price'
        element={
          <ProtectedRoute>
            <ScheduledPrice />
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
        path='/master/company'
        element={
          <ProtectedRoute>
            <Companies />
          </ProtectedRoute>
        }
      />
      <Route
        path='/master/master-parameter'
        element={
          <ProtectedRoute>
            <MasterParameter />
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
        path='/laporan-penerimaan-barang'
        element={
          <ProtectedRoute>
            <LaporanPenerimaanBarang />
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
      <Route
        path='/returns'
        element={
          <ProtectedRoute>
            <Returns />
          </ProtectedRoute>
        }
      />
      <Route
        path='/returns/create'
        element={
          <ProtectedRoute>
            <ReturnCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path='/returns/:id'
        element={
          <ProtectedRoute>
            <ReturnDetail />
          </ProtectedRoute>
        }
      />
      <Route path='/' element={<Navigate to='/reporting' replace />} />
      <Route path='*' element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;
