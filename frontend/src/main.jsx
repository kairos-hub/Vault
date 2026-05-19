import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import useAuthStore from './utils/authStore';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProductPage from './pages/ProductPage';
import ColumnsEditor from './pages/ColumnsEditor';
import AdminUsers from './pages/AdminUsers';

function RequireAuth({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="product/:id" element={<ProductPage />} />
          <Route path="product/:id/columns" element={<ColumnsEditor />} />
          <Route path="admin/users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
