import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './hooks/ProtectedRoute';
import AdminShell from './layout/AdminShell';

import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products/index';
import ProductForm from './pages/admin/Products/ProductForm';
import Categories from './pages/admin/Categories/index';
import CategoryForm from './pages/admin/Categories/CategoryForm';
import Orders from './pages/admin/Orders/index';
import OrderDetail from './pages/admin/Orders/OrderDetail';
import Customers from './pages/admin/Customers/index';
import CustomerDetail from './pages/admin/Customers/CustomerDetail';
import Blogs from './pages/admin/Blogs/index';
import BlogForm from './pages/admin/Blogs/BlogForm';
import BlogCategories from './pages/admin/BlogCategories/index';
import BlogCategoryForm from './pages/admin/BlogCategories/BlogCategoryForm';
import MediaCoverage from './pages/admin/MediaCoverage/index';
import MediaCoverageForm from './pages/admin/MediaCoverage/MediaCoverageForm';
import Coupons from './pages/admin/Coupons';
import Newsletter from './pages/admin/Newsletter';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import Profile from './pages/admin/Profile';

export default function AdminRouter() {
  return (
    <AuthProvider>
      <Routes>
      {/* Public */}
      <Route path="login" element={<Login />} />

      {/* Protected — nested under /admin/* shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"         element={<Dashboard />} />
        <Route path="products"          element={<Products />} />
        <Route path="products/new"      element={<ProductForm />} />
        <Route path="products/:id"      element={<ProductForm />} />
        <Route path="categories"        element={<Categories />} />
        <Route path="categories/new"    element={<CategoryForm />} />
        <Route path="categories/:id"    element={<CategoryForm />} />
        <Route path="orders"            element={<Orders />} />
        <Route path="orders/:id"        element={<OrderDetail />} />
        <Route path="customers"         element={<Customers />} />
        <Route path="customers/:id"     element={<CustomerDetail />} />
        <Route path="blogs"             element={<Blogs />} />
        <Route path="blogs/new"         element={<BlogForm />} />
        <Route path="blogs/:id"         element={<BlogForm />} />
        <Route path="blog-categories"        element={<BlogCategories />} />
        <Route path="blog-categories/new"    element={<BlogCategoryForm />} />
        <Route path="blog-categories/:id"    element={<BlogCategoryForm />} />
        <Route path="media-coverage"         element={<MediaCoverage />} />
        <Route path="media-coverage/new"     element={<MediaCoverageForm />} />
        <Route path="media-coverage/:id"     element={<MediaCoverageForm />} />
        <Route path="coupons"           element={<Coupons />} />
        <Route path="newsletter"        element={<Newsletter />} />
        <Route path="reports"           element={<Reports />} />
        <Route path="settings"          element={<Settings />} />
        <Route path="profile"           element={<Profile />} />
      </Route>


      <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
