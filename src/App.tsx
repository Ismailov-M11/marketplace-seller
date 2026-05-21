import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "./shared/store/auth";
import LoginPage from "./pages/Login";
import ChangePasswordPage from "./pages/ChangePassword";
import DashboardPage from "./pages/Dashboard";
import CatalogPage from "./pages/Catalog";
import ProductsPage from "./pages/Products";
import ProductEditPage from "./pages/ProductEdit";
import OrdersPage from "./pages/Orders";
import OrderDetailPage from "./pages/OrderDetail";
import SettingsPage from "./pages/Settings";
import Layout from "./components/Layout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, mustChangePassword } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  return <>{children}</>;
}

// Reads ?token= from URL and logs in automatically (admin impersonation)
function TokenHandler() {
  const { setToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setToken(token);
      // Remove token from URL
      window.history.replaceState({}, "", window.location.pathname);
      navigate("/", { replace: true });
    }
  }, []);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <TokenHandler />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/catalog" element={<CatalogPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/new" element={<ProductEditPage />} />
                  <Route path="/products/:id/edit" element={<ProductEditPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/orders/:id" element={<OrderDetailPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
