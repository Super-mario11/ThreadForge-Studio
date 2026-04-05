import { lazy } from 'react';

const HomePage = lazy(() => import('../pages/HomePage.jsx'));
const ShopPage = lazy(() => import('../pages/ShopPage.jsx'));
const StudioPage = lazy(() => import('../pages/StudioPage.jsx'));
const CartPage = lazy(() => import('../pages/CartPage.jsx'));
const AuthPage = lazy(() => import('../pages/AuthPage.jsx'));
const DashboardPage = lazy(() => import('../pages/DashboardPage.jsx'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage.jsx'));
const OrderSuccessPage = lazy(() => import('../pages/OrderSuccessPage.jsx'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'));

export const appRoutes = [
  { path: '/', Component: HomePage },
  { path: '/shop', Component: ShopPage },
  { path: '/studio', Component: StudioPage },
  { path: '/cart', Component: CartPage },
  { path: '/auth', Component: AuthPage },
  { path: '/dashboard', Component: DashboardPage },
  { path: '/checkout', Component: CheckoutPage },
  { path: '/order-success/:orderId', Component: OrderSuccessPage },
  { path: '*', Component: NotFoundPage }
];
