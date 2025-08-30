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
