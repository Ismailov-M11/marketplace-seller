import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../shared/api/client";
import { toast } from "sonner";
import { useAuthStore } from "../shared/store/auth";
import { Bot, Palette, Bell, LogOut } from "lucide-react";

const settingsSchema = z.object({
  welcome_text: z.string().optional(),
  delivery_fee: z.number().min(0).optional(),
  min_order_amount: z.number().min(0).optional(),
  brand_primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Noto'g'ri rang format").optional(),
  notification_chat_id: z.string().optional(),
});
type SettingsForm = z.infer<typeof settingsSchema>;

interface BotSettings {
  welcome_text?: string;
  delivery_fee?: number;
  min_order_amount?: number;
  brand_primary_color?: string;
  notification_chat_id?: string;
}

export default function SettingsPage() {
  const logout = useAuthStore((s) => s.logout);

  const { data, isLoading } = useQuery<BotSettings>({
    queryKey: ["bot-settings"],
    queryFn: () => api.get("/api/v1/seller/settings/bot").then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    if (data) {
      reset({
        welcome_text: data.welcome_text ?? "",
        delivery_fee: data.delivery_fee ? data.delivery_fee / 100 : 0,
        min_order_amount: data.min_order_amount ? data.min_order_amount / 100 : 0,
        brand_primary_color: data.brand_primary_color ?? "#2563eb",
        notification_chat_id: data.notification_chat_id ?? "",
      });
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (form: SettingsForm) =>
      api.patch("/api/v1/seller/settings/bot", {
        ...form,
        delivery_fee: form.delivery_fee ? Math.round((form.delivery_fee ?? 0) * 100) : 0,
        min_order_amount: form.min_order_amount ? Math.round((form.min_order_amount ?? 0) * 100) : 0,
      }),
    onSuccess: () => toast.success("Sozlamalar saqlandi"),
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  if (isLoading) return <div className="text-gray-400">Yuklanmoqda...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sozlamalar</h1>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={18} className="text-blue-600" />
            <h3 className="font-medium text-gray-700">Bot sozlamalari</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xush kelibsiz matni</label>
            <textarea
              {...register("welcome_text")}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Botga xush kelibsiz! Iltimos, katalogdan mahsulot tanlang."
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={18} className="text-blue-600" />
            <h3 className="font-medium text-gray-700">Brend rangi</h3>
          </div>
          <div className="flex items-center gap-3">
            <input
              {...register("brand_primary_color")}
              type="color"
              className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
            />
            <input
              {...register("brand_primary_color")}
              type="text"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#2563eb"
            />
          </div>
          {errors.brand_primary_color && (
            <p className="text-red-500 text-xs mt-1">{errors.brand_primary_color.message}</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-medium text-gray-700">To'lov va yetkazish</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yetkazish narxi (sum)</label>
              <input
                {...register("delivery_fee", { valueAsNumber: true })}
                type="number"
                min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min buyurtma (sum)</label>
              <input
                {...register("min_order_amount", { valueAsNumber: true })}
                type="number"
                min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-blue-600" />
            <h3 className="font-medium text-gray-700">Bildirishnomalar</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telegram chat ID</label>
            <input
              {...register("notification_chat_id")}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="-100xxxxxxxxxx"
            />
            <p className="text-xs text-gray-400 mt-1">Yangi buyurtmalar haqida xabar oling</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={!isDirty || saveMutation.isPending}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </form>

      <button
        onClick={() => { if (confirm("Chiqishni tasdiqlaysizmi?")) logout(); }}
        className="w-full mt-3 flex items-center justify-center gap-2 border border-red-200 text-red-500 py-3 rounded-xl font-medium hover:bg-red-50"
      >
        <LogOut size={16} /> Chiqish
      </button>
    </div>
  );
}
