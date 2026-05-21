import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../shared/api/client";
import { Plus, Search, Edit2, Trash2, Package, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

function ImageLightbox({ images, startIndex, onClose }: { images: Array<{ id: number; url: string }>; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white"><X size={28} /></button>
      <button
        onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.max(0, i - 1)); }}
        className="absolute left-4 text-white disabled:opacity-30"
        disabled={idx === 0}
      ><ChevronLeft size={32} /></button>
      <img
        src={images[idx].url}
        alt=""
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.min(images.length - 1, i + 1)); }}
        className="absolute right-4 text-white disabled:opacity-30"
        disabled={idx === images.length - 1}
      ><ChevronRight size={32} /></button>
      <div className="absolute bottom-4 text-white text-sm">{idx + 1} / {images.length}</div>
    </div>
  );
}

function formatPrice(tiyins: number) {
  return `${Math.floor(tiyins / 100).toLocaleString("ru-RU")} sum`;
}

interface Product {
  id: number;
  name_uz: string;
  name_ru?: string;
  category_id?: number | null;
  variants: Array<{ id: number; name_uz?: string | null; name_ru?: string | null; price: number; stock_quantity: number; sku?: string | null }>;
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
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<{ images: Array<{ id: number; url: string }>; index: number } | null>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products", search, categoryFilter],
    queryFn: () =>
      api
        .get("/api/v1/seller/products", { params: { q: search || undefined, category_id: categoryFilter || undefined } })
        .then((r) => r.data.items),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/api/v1/seller/categories").then((r) => r.data),
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

  const uploadImageMutation = useMutation({
    mutationFn: ({ productId, file }: { productId: number; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post(`/api/v1/seller/products/${productId}/images`, formData);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Rasm qo'shildi"); },
    onError: () => toast.error("Rasmni yuklashda xatolik"),
  });

  const deleteImageMutation = useMutation({
    mutationFn: ({ productId, imageId }: { productId: number; imageId: number }) =>
      api.delete(`/api/v1/seller/products/${productId}/images/${imageId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Rasm o'chirildi"); },
    onError: () => toast.error("Xatolik"),
  });

  if (isLoading) return <div className="text-gray-400">Yuklanmoqda...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mahsulotlar</h1>
        <button
          onClick={() => navigate("/products/new")}
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
          <button onClick={() => navigate("/products/new")} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
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
                  <div className="text-xs text-gray-400">
                    {p.category_id ? categories.find((c) => c.id === p.category_id)?.name_uz : ""}{p.category_id ? " · " : ""}{p.variants.length} variant
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700">
                  {p.variants.length > 0 ? formatPrice(Math.min(...p.variants.map((v) => v.price))) : "—"}
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
                <button onClick={() => navigate(`/products/${p.id}/edit`)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
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
                <div className="border-t border-gray-50 bg-gray-50 px-4 py-3 space-y-3">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">Variantlar</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {p.variants.map((v) => (
                        <div key={v.id} className="bg-white rounded-lg p-2 border border-gray-100">
                          <div className="font-medium text-gray-800">{v.name_uz || v.name_ru || "Variant"}</div>
                          <div className="text-blue-600">{formatPrice(v.price)}</div>
                          <div className="text-gray-400">Stok: {v.stock_quantity}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">Rasmlar</div>
                    <div className="flex gap-2 flex-wrap items-center">
                      {p.images.map((img, imgIdx) => (
                        <div key={img.id} className="relative group w-16 h-16">
                          <img
                            src={img.url}
                            alt=""
                            className="w-full h-full object-cover rounded-lg border border-gray-200 cursor-zoom-in"
                            onClick={() => setLightbox({ images: p.images, index: imgIdx })}
                          />
                          <button
                            onClick={() => deleteImageMutation.mutate({ productId: p.id, imageId: img.id })}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:text-blue-400 text-gray-400 transition-colors">
                        {uploadImageMutation.isPending ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <Plus size={20} />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadImageMutation.mutate({ productId: p.id, file });
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
