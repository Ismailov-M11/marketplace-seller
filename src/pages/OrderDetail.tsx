import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../shared/api/client";
import { ArrowLeft, Phone, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

function formatPrice(tiyins: number) {
  return `${Math.floor(tiyins / 100).toLocaleString("ru-RU")} sum`;
}

const STATUS_LABELS: Record<string, string> = {
  new: "Yangi",
  confirmed: "Tasdiqlangan",
  preparing: "Tayyorlanmoqda",
  ready: "Tayyor",
  delivering: "Yetkazilmoqda",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilingan",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-red-100 text-red-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-yellow-100 text-yellow-700",
  ready: "bg-purple-100 text-purple-700",
  delivering: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const NEXT_STATUSES: Record<string, { key: string; label: string; color: string }[]> = {
  new: [{ key: "confirmed", label: "Tasdiqlash", color: "bg-blue-600" }, { key: "cancelled", label: "Bekor qilish", color: "bg-red-500" }],
  confirmed: [{ key: "preparing", label: "Tayyorlanmoqda", color: "bg-yellow-500" }, { key: "cancelled", label: "Bekor qilish", color: "bg-red-500" }],
  preparing: [{ key: "ready", label: "Tayyor", color: "bg-purple-600" }],
  ready: [{ key: "delivering", label: "Yetkazishga berish", color: "bg-orange-500" }],
  delivering: [{ key: "delivered", label: "Yetkazildi", color: "bg-green-600" }],
};

interface OrderDetail {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_address?: string;
  comment?: string;
  created_at: string;
  customer: {
    id: number;
    first_name: string;
    last_name?: string;
    phone?: string;
    telegram_user_id: number;
  };
  items: Array<{
    id: number;
    product_name: string;
    variant_name: string;
    quantity: number;
    price_snap: number;
  }>;
  status_history: Array<{
    status: string;
    comment?: string;
    created_at: string;
  }>;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery<OrderDetail>({
    queryKey: ["order", id],
    queryFn: () => api.get(`/api/v1/seller/orders/${id}`).then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, comment }: { status: string; comment?: string }) =>
      api.patch(`/api/v1/seller/orders/${id}/status`, { status, comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Status yangilandi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  if (isLoading) return <div className="text-gray-400">Yuklanmoqda...</div>;
  if (!order) return <div className="text-gray-400">Buyurtma topilmadi</div>;

  const nextStatuses = NEXT_STATUSES[order.status] ?? [];

  return (
    <div>
      <button onClick={() => navigate("/orders")} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 mb-5 text-sm">
        <ArrowLeft size={16} /> Orqaga
      </button>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">#{order.order_number}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date(order.created_at).toLocaleString("ru-RU")}
          </p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {nextStatuses.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {nextStatuses.map((s) => (
            <button
              key={s.key}
              onClick={() => statusMutation.mutate({ status: s.key })}
              disabled={statusMutation.isPending}
              className={`${s.color} text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-medium text-gray-700 mb-3">Mijoz</h3>
          <div className="space-y-2">
            <div className="font-semibold text-gray-900">{order.customer.first_name} {order.customer.last_name ?? ""}</div>
            {order.customer.phone && (
              <a href={`tel:${order.customer.phone}`} className="flex items-center gap-2 text-sm text-blue-600">
                <Phone size={14} /> {order.customer.phone}
              </a>
            )}
            <a
              href={`https://t.me/user?id=${order.customer.telegram_user_id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600"
            >
              <MessageCircle size={14} /> Telegramda yozish
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-medium text-gray-700 mb-3">Yetkazish</h3>
          {order.delivery_address ? (
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <MapPin size={14} className="mt-0.5 flex-shrink-0" /> {order.delivery_address}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Manzil ko'rsatilmagan</p>
          )}
          {order.comment && (
            <div className="mt-2 text-sm text-gray-500 italic">"{order.comment}"</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mt-4">
        <h3 className="font-medium text-gray-700 mb-3">Buyurtma tarkibi</h3>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                <div className="text-xs text-gray-400">{item.variant_name} × {item.quantity}</div>
              </div>
              <div className="font-semibold text-gray-900">{formatPrice(item.price_snap * item.quantity)}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Mahsulotlar</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Yetkazish</span>
            <span>{order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : "Bepul"}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-1">
            <span>Jami</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {order.status_history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mt-4">
          <h3 className="font-medium text-gray-700 mb-3">Status tarixi</h3>
          <div className="space-y-2">
            {order.status_history.map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-800">{STATUS_LABELS[h.status] ?? h.status}</div>
                  {h.comment && <div className="text-xs text-gray-400">{h.comment}</div>}
                  <div className="text-xs text-gray-400">{new Date(h.created_at).toLocaleString("ru-RU")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
