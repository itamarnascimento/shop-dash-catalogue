import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import { WishlistProvider } from "@/context/WishlistContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import NotificationPreferences from "./pages/NotificationPreferences";
import Wishlist from "./pages/Wishlist";
import OrderHistory from "./pages/OrderHistory";
import DeliveryAddresses from "./pages/DeliveryAddresses";
import ProductManagement from "./pages/ProductManagement";
import UserManagement from "./pages/UserManagement";
import CategoryManagement from "./pages/CategoryManagement";
import OrderManagement from "./pages/OrderManagement";
import OrderReports from "./pages/OrderReports";
import OrderDetail from "./pages/OrderDetail";
import Checkout from "./pages/Checkout";
import CarouselManagement from "./pages/CarouselManagement";
import CouponManagement from "./pages/CouponManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/order/:orderId" element={<OrderDetail />
                } />
                <Route path="/addresses" element={<DeliveryAddresses />} />
                <Route path="/notifications" element={<NotificationPreferences />} />
                <Route path="/admin/products" element={
                  <ProtectedAdminRoute>
                    <ProductManagement />
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedAdminRoute>
                    <UserManagement />
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/categories" element={
                  <ProtectedAdminRoute>
                    <CategoryManagement />
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/orders" element={
                  <ProtectedAdminRoute>
                    <OrderManagement />
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/order-reports" element={
                  <ProtectedAdminRoute>
                    <OrderReports />
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/carousel" element={
                  <ProtectedAdminRoute>
                    <CarouselManagement />
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/coupons" element={
                  <ProtectedAdminRoute>
                    <CouponManagement />
                  </ProtectedAdminRoute>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
