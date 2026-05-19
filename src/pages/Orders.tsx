import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../shared/api/client";
import { ShoppingBag, ChevronRight } from "lucide-react";

function formatPrice(tiyins: number) {
  return `${Math.floor(tiyins / 100).toLocaleString("ru-RU")} sum`;
}

const STATUS_TABS = [
  { key: "", label: "Barchasi" },
  { key: "new", label: "Yangi" },
  { key: "confirmed", label: "Tasdiqlangan" },
  { key: "preparing", label: "Tayyorlanmoqda" },
  { key: "ready", label: "Tayyor" },
  { key: "delivering", label: "Yetkazilmoqda" },
  { key: "delivered", label: "Yetkazildi" },
  { key: "cancelled", label: "Bekor" },
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-red-100 text-red-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-yellow-100 text-yellow-700",
  ready: "bg-purple-100 text-purple-700",
  delivering: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Yangi",
  confirmed: "Tasdiqlangan",
  preparing: "Tayyorlanmoqda",
  ready: "Tayyor",
  delivering: "Yetkazilmoqda",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilingan",
};

interface Order {
  id: number;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  customer: { id: number; first_name: string; last_name?: string; phone?: string };
  items_count: number;
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["orders", statusFilter],
    queryFn: () =>
      api.get("/api/v1/seller/orders", { params: { status: statusFilter || undefined } }).then((r) => r.data),
    refetchInterval: 20_000,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buyurtmalar</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-gray-400">Yuklanmoqda...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Buyurtmalar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">#{order.order_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {order.customer.first_name} {order.customer.last_name ?? ""} · {order.items_count} mahsulot
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatPrice(order.total)}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
