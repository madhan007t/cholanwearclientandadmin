import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import { BrandLoader } from './components/ui';
import StoreLayout from './store-front/layouts/StoreLayout';
import Home from './store-front/pages/Home';
import Shop from './store-front/pages/Shop';
import ProductDetail from './store-front/pages/ProductDetail';
import Cart from './store-front/pages/Cart';
import { About, Contact, NotFound } from './store-front/pages/Static';

// Customer-critical pages load eagerly; checkout and the whole admin module are code-split.
const Checkout = lazy(() => import('./store-front/pages/Checkout'));
const OrderSuccess = lazy(() => import('./store-front/pages/OrderSuccess'));
const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'));
const AdminLogin = lazy(() => import('./admin/pages/Login'));
const Dashboard = lazy(() => import('./admin/pages/Dashboard'));
const Products = lazy(() => import('./admin/pages/Products'));
const ProductForm = lazy(() => import('./admin/pages/ProductForm'));
const Categories = lazy(() => import('./admin/pages/Categories'));
const Orders = lazy(() => import('./admin/pages/Orders'));
const OrderDetail = lazy(() => import('./admin/pages/OrderDetail'));
const Customers = lazy(() => import('./admin/pages/CustomersSettings').then((m) => ({ default: m.Customers })));
const SettingsPage = lazy(() => import('./admin/pages/CustomersSettings').then((m) => ({ default: m.SettingsPage })));

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={<BrandLoader label="Loading page" />}>
        <Routes>
          {/* Customer storefront - no authentication */}
          <Route element={<StoreLayout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="category/:slug" element={<Shop />} />
            <Route path="product/:slug" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="order-success" element={<OrderSuccess />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin - the only authenticated area */}
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductForm />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="customers" element={<Customers />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { background: '#0A0A0A', color: '#FFFFFF', borderRadius: 0, border: '1px solid #D2A24E', fontSize: '13px' },
          iconTheme: { primary: '#D2A24E', secondary: '#0A0A0A' },
          error: { iconTheme: { primary: '#B3261E', secondary: '#FFFFFF' } },
        }}
      />
    </MotionConfig>
  );
}
