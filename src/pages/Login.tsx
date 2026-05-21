import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../shared/store/auth";
import { useSellerLang, st } from "../shared/store/lang";
import { api } from "../shared/api/client";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUser, setMustChange } = useAuthStore();
  const { lang, setLang } = useSellerLang();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/v1/seller/auth/login", { email, password });
      setToken(res.data.access_token);
      const meRes = await api.get("/api/v1/seller/auth/me");
      setUser(meRes.data);
      setMustChange(meRes.data.must_change_password);
      if (meRes.data.must_change_password) {
        navigate("/change-password");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || (lang === "ru" ? "Ошибка входа" : "Login xatosi"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === "uz" ? "ru" : "uz")}
            className="text-xs font-semibold border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
          >
            {lang === "uz" ? "🇷🇺 Русский" : "🇺🇿 O'zbekcha"}
          </button>
        </div>
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🛍</div>
          <h1 className="text-xl font-bold text-gray-900">{st("loginTitle", lang)}</h1>
          <p className="text-sm text-gray-500 mt-1">{st("loginSubtitle", lang)}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{st("email", lang)}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{st("password", lang)}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? st("loggingIn", lang) : st("loginBtn", lang)}
          </button>
        </form>
      </div>
    </div>
  );
}
