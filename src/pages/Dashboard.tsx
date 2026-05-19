import { useQuery } from "@tanstack/react-query";
import { api } from "../shared/api/client";
import { ShoppingCart, Package, Users, TrendingUp } from "lucide-react";

function formatPrice(tiyins: number): string {
  return `${Math.floor(tiyins / 100).toLocaleString("ru-RU")} sum`;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/api/v1/seller/dashboard").then((r) => r.data),
    refetchInterval: 30_000,
  });

  if (isLoading) return <div className="text-gray-400">Yuklanmoqda...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {data?.new_orders > 0 && (
          <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-medium animate-pulse">
            🔔 {data.new_orders} yangi buyurtma
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ShoppingCart} label="Bugun buyurtmalar" value={data?.today?.orders} color="blue" />
        <StatCard icon={TrendingUp} label="Bugun daromad" value={formatPrice(data?.today?.revenue || 0)} color="green" />
        <StatCard icon={Package} label="Jami mahsulotlar" value={data?.total_products} color="purple" />
        <StatCard icon={Users} label="Jami mijozlar" value={data?.total_customers} color="orange" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-medium text-gray-700 mb-3">Haftalik</h3>
          <div className="text-3xl font-bold text-gray-900 mb-1">{data?.week?.orders || 0}</div>
          <div className="text-sm text-gray-500">buyurtma · {formatPrice(data?.week?.revenue || 0)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-medium text-gray-700 mb-3">Oylik</h3>
          <div className="text-3xl font-bold text-gray-900 mb-1">{data?.month?.orders || 0}</div>
          <div className="text-sm text-gray-500">buyurtma · {formatPrice(data?.month?.revenue || 0)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-medium text-gray-700 mb-3">Yangi buyurtmalar</h3>
          <div className="text-3xl font-bold text-red-600 mb-1">{data?.new_orders || 0}</div>
          <div className="text-sm text-gray-500">tasdiqlanmagan</div>
          {data?.new_orders > 0 && (
            <a href="/orders?status=new" className="text-sm text-blue-600 hover:underline mt-2 block">Ko'rish →</a>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon size={18} />
      </div>
      <div className="text-xl font-bold text-gray-900">{value ?? "—"}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
