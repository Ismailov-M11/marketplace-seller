import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../shared/api/client";
import { useAuthStore } from "../shared/store/auth";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setMustChange = useAuthStore((s) => s.setMustChange);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) { toast.error("Parol kamida 8 ta belgi"); return; }
    setLoading(true);
    try {
      await api.post("/api/v1/seller/auth/change-password", {
        current_password: current,
        new_password: next,
      });
      setMustChange(false);
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Parolni o'zgartirish</h1>
        <p className="text-sm text-gray-500 mb-6">Xavfsizlik uchun dastlabki parolni o'zgartiring</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Joriy parol</label>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yangi parol (min. 8 ta belgi)</label>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </form>
      </div>
    </div>
  );
}
