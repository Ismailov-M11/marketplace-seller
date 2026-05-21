import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, Package, ShoppingCart, Settings, LogOut } from "lucide-react";
import { useAuthStore } from "../shared/store/auth";
import { useSellerLang, st } from "../shared/store/lang";
import { api } from "../shared/api/client";

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { lang, setLang } = useSellerLang();

  const NAV = [
    { to: "/",        icon: LayoutDashboard, label: st("dashboard", lang) },
    { to: "/catalog", icon: BookOpen,         label: st("catalog",   lang) },
    { to: "/products",icon: Package,          label: st("products",  lang) },
    { to: "/orders",  icon: ShoppingCart,     label: st("orders",    lang) },
    { to: "/settings",icon: Settings,         label: st("settings",  lang) },
  ];

  const handleLogout = async () => {
    try { await api.post("/api/v1/seller/auth/logout"); } catch {}
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 md:hidden">
        <div className="flex">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2 text-xs ${isActive ? "text-blue-600" : "text-gray-400"}`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col">
        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6">
          <span className="font-bold text-lg text-blue-600">🛍 {user?.full_name?.split(" ")[0] || "Seller"}</span>
          <button
            onClick={() => setLang(lang === "uz" ? "ru" : "uz")}
            className="text-xs font-semibold border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 transition"
          >
            {lang === "uz" ? "RU" : "UZ"}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-400 mb-2">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600"
          >
            <LogOut size={16} /> {st("logout", lang)}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
