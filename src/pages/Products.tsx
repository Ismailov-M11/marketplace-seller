import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../shared/api/client";
import { Plus, Search, Edit2, Trash2, Package, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

function formatPrice(tiyins: number) {
  return `${Math.floor(tiyins / 100).toLocaleString("ru-RU")} sum`;
}

const variantSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Nom kerak"),
  price: z.number().min(0),
  stock_quantity: z.number().min(0),
  sku: z.string().optional(),
});

const productSchema = z.object({
  name_uz: z.string().min(1, "Nomni kiriting"),
  name_ru: z.string().optional(),
  description_uz: z.string().optional(),
  category_id: z.number({ required_error: "Kategoriya tanlang" }).nullable(),
  variants: z.array(variantSchema).min(1, "Kamida 1 variant kerak"),
});
type ProductForm = z.infer<typeof productSchema>;

interface Product {
  id: number;
  name_uz: string;
  name_ru?: string;
  category?: { id: number; name_uz: string };
  variants: Array<{ id: number; name: string; price: number; stock_quantity: number; sku?: string }>;
  images: Array<{ id: number; url: string }>;
  is_active: boolean;
}

interface Category {
  id: number;
  name_uz: string;
  parent_id: number | null;
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [modal, setModal] = useState<{ open: boolean; editing?: Product }>({ open: false });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products", search, categoryFilter],
    queryFn: () =>
      api
        .get("/api/v1/seller/products", { params: { search: search || undefined, category_id: categoryFilter || undefined } })
        .then((r) => r.data),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/api/v1/seller/categories").then((r) => r.data),
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { variants: [{ name: "Asosiy", price: 0, stock_quantity: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  const createMutation = useMutation({
    mutationFn: (data: ProductForm) => api.post("/api/v1/seller/products", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); closeModal(); toast.success("Mahsulot qo'shildi"); },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductForm }) => api.patch(`/api/v1/seller/products/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); closeModal(); toast.success("Yangilandi"); },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/seller/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("O'chirildi"); },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.patch(`/api/v1/seller/products/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  function openAdd() {
    reset({ name_uz: "", name_ru: "", description_uz: "", category_id: null, variants: [{ name: "Asosiy", price: 0, stock_quantity: 0 }] });
    setModal({ open: true });
  }

  function openEdit(p: Product) {
    reset({
      name_uz: p.name_uz,
      name_ru: p.name_ru ?? "",
      category_id: p.category?.id ?? null,
      variants: p.variants.map((v) => ({ id: v.id, name: v.name, price: v.price / 100, stock_quantity: v.stock_quantity, sku: v.sku })),
    });
    setModal({ open: true, editing: p });
  }

  function closeModal() {
    setModal({ open: false });
    reset();
  }

  function onSubmit(data: ProductForm) {
    const payload = {
      ...data,
      variants: data.variants.map((v) => ({ ...v, price: Math.round(v.price * 100) })),
    };
    if (modal.editing) {
      updateMutation.mutate({ id: modal.editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  if (isLoading) return <div className="text-gray-400">Yuklanmoqda...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mahsulotlar</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} /> Qo'shish
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mahsulot qidirish..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Barcha kategoriyalar</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name_uz}</option>
          ))}
        </select>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Package size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">Mahsulotlar topilmadi</p>
          <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Birinchi mahsulotni qo'shish
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {p.images[0] ? (
                    <img src={p.images[0].url} alt={p.name_uz} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={16} className="m-auto mt-3 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{p.name_uz}</div>
                  <div className="text-xs text-gray-400">{p.category?.name_uz} · {p.variants.length} variant</div>
                </div>
                <div className="text-sm font-semibold text-gray-700">
                  {formatPrice(Math.min(...p.variants.map((v) => v.price)))}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={p.is_active}
                    onChange={(e) => toggleActiveMutation.mutate({ id: p.id, is_active: e.target.checked })}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
                <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => { if (confirm("O'chirishni tasdiqlaysizmi?")) deleteMutation.mutate(p.id); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                >
                  <Trash2 size={14} />
                </button>
                <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} className="p-1.5 text-gray-400 rounded">
                  {expandedId === p.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {expandedId === p.id && (
                <div className="border-t border-gray-50 bg-gray-50 px-4 py-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {p.variants.map((v) => (
                      <div key={v.id} className="bg-white rounded-lg p-2 border border-gray-100">
                        <div className="font-medium text-gray-800">{v.name}</div>
                        <div className="text-blue-600">{formatPrice(v.price)}</div>
                        <div className="text-gray-400">Stok: {v.stock_quantity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                {modal.editing ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
              </h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomi (UZ) *</label>
                  <input {...register("name_uz")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.name_uz && <p className="text-red-500 text-xs mt-1">{errors.name_uz.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomi (RU)</label>
                  <input {...register("name_ru")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya</label>
                <select
                  {...register("category_id", { valueAsNumber: true })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tanlang</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_uz}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif</label>
                <textarea {...register("description_uz")} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Variantlar</label>
                  <button
                    type="button"
                    onClick={() => append({ name: "", price: 0, stock_quantity: 0 })}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> Variant qo'shish
                  </button>
                </div>
                <div className="space-y-2">
                  {fields.map((field, i) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                      <input
                        {...register(`variants.${i}.name`)}
                        placeholder="Nom"
                        className="col-span-4 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        {...register(`variants.${i}.price`, { valueAsNumber: true })}
                        type="number"
                        placeholder="Narx (sum)"
                        className="col-span-4 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        {...register(`variants.${i}.stock_quantity`, { valueAsNumber: true })}
                        type="number"
                        placeholder="Stok"
                        className="col-span-3 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(i)} className="col-span-1 text-red-400 hover:text-red-600 flex justify-center">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.variants && <p className="text-red-500 text-xs mt-1">{errors.variants.message}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium">
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {modal.editing ? "Saqlash" : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
