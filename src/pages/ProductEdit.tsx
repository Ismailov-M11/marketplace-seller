import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../shared/api/client";
import {
  ArrowLeft, Plus, Trash2, Package, ChevronDown, ChevronUp,
  Star, Eye, EyeOff, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

// ── Schemas ────────────────────────────────────────────────────────────────────

const variantSchema = z.object({
  id: z.number().optional(),
  name_uz: z.string().optional(),
  name_ru: z.string().optional(),
  sku: z.string().optional(),
  price: z.number({ invalid_type_error: "Narx kiriting" }).min(0),
  old_price: z.number().min(0).nullable().optional(),
  stock_quantity: z.number().min(0).default(0),
  track_stock: z.boolean().default(true),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

const productSchema = z.object({
  name_uz: z.string().min(1, "Nomni kiriting"),
  name_ru: z.string().optional(),
  description_uz: z.string().optional(),
  description_ru: z.string().optional(),
  category_id: z.number().nullable().optional(),
  sku: z.string().optional(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.number().default(0),
  variants: z.array(variantSchema).min(1, "Kamida 1 ta variant kerak"),
});

type ProductForm = z.infer<typeof productSchema>;

// ── Types ──────────────────────────────────────────────────────────────────────

interface Variant {
  id: number;
  name_uz: string | null;
  name_ru: string | null;
  sku: string | null;
  price: number;
  old_price: number | null;
  stock_quantity: number;
  track_stock: boolean;
  is_default: boolean;
  is_active: boolean;
}

interface ProductImage {
  id: number;
  url: string;
  thumb_url: string | null;
  sort_order: number;
}

interface Product {
  id: number;
  name_uz: string;
  name_ru: string;
  description_uz: string | null;
  description_ru: string | null;
  category_id: number | null;
  sku: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  variants: Variant[];
  images: ProductImage[];
}

interface Category {
  id: number;
  name_uz: string;
  parent_id: number | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatSum(tiyins: number) {
  return `${Math.floor(tiyins / 100).toLocaleString("ru-RU")} so'm`;
}

function inp(extra = "") {
  return `w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${extra}`;
}

// ── Lightbox ───────────────────────────────────────────────────────────────────

function Lightbox({ images, startIndex, onClose }: { images: ProductImage[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white"><X size={28} /></button>
      <button
        onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.max(0, i - 1)); }}
        className="absolute left-4 text-white disabled:opacity-30" disabled={idx === 0}
      ><ChevronLeft size={32} /></button>
      <img
        src={images[idx].url} alt=""
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.min(images.length - 1, i + 1)); }}
        className="absolute right-4 text-white disabled:opacity-30" disabled={idx === images.length - 1}
      ><ChevronRight size={32} /></button>
      <div className="absolute bottom-4 text-white text-sm">{idx + 1} / {images.length}</div>
    </div>
  );
}

// ── Preview ────────────────────────────────────────────────────────────────────

function ProductPreview({ values, categories, images }: {
  values: ProductForm;
  categories: Category[];
  images: ProductImage[];
}) {
  const activeVariants = values.variants.filter((v) => v.is_active !== false);
  const prices = activeVariants.map((v) => v.price).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) * 100 : 0;
  const maxPrice = prices.length ? Math.max(...prices) * 100 : 0;
  const category = categories.find((c) => c.id === values.category_id);
  const coverImg = images[0]?.url;

  return (
    <div className="sticky top-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Telegram preview</p>

      {/* Phone mock */}
      <div className="bg-[#17212B] rounded-2xl overflow-hidden shadow-xl max-w-[320px] mx-auto">
        {/* Header */}
        <div className="bg-[#232E3C] px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">B</div>
          <div>
            <div className="text-white text-sm font-medium">Bot Shop</div>
            <div className="text-gray-400 text-xs">online</div>
          </div>
        </div>

        {/* Product card */}
        <div className="p-3">
          <div className="bg-[#232E3C] rounded-xl overflow-hidden">
            {/* Image */}
            <div className="aspect-video bg-[#2B5278] relative flex items-center justify-center">
              {coverImg ? (
                <img src={coverImg} alt="" className="w-full h-full object-cover" />
              ) : (
                <Package size={40} className="text-blue-400 opacity-40" />
              )}
              {values.is_featured && (
                <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star size={9} /> Featured
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              {category && (
                <div className="text-blue-400 text-[10px] mb-1 uppercase tracking-wide">{category.name_uz}</div>
              )}
              <div className="text-white font-semibold text-sm leading-tight mb-1">
                {values.name_uz || <span className="opacity-30">Mahsulot nomi</span>}
              </div>
              {values.name_ru && (
                <div className="text-gray-400 text-xs mb-1">{values.name_ru}</div>
              )}

              {/* Price */}
              {prices.length > 0 && (
                <div className="text-green-400 font-bold text-sm mb-2">
                  {minPrice === maxPrice ? formatSum(minPrice) : `${formatSum(minPrice)} – ${formatSum(maxPrice)}`}
                </div>
              )}

              {/* Description */}
              {values.description_uz && (
                <div className="text-gray-400 text-xs mb-2 line-clamp-2">{values.description_uz}</div>
              )}

              {/* Variants */}
              {activeVariants.length > 1 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {activeVariants.slice(0, 4).map((v, i) => (
                    <span
                      key={i}
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${i === 0 ? "bg-blue-600 border-blue-600 text-white" : "border-gray-500 text-gray-300"}`}
                    >
                      {v.name_uz || v.name_ru || `Variant ${i + 1}`}
                    </span>
                  ))}
                  {activeVariants.length > 4 && (
                    <span className="text-[10px] text-gray-500">+{activeVariants.length - 4}</span>
                  )}
                </div>
              )}

              {/* Buy button */}
              <button className="w-full bg-blue-600 text-white text-xs font-semibold py-2 rounded-lg mt-1">
                🛒 Savatga qo'shish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex gap-2 mt-3 justify-center flex-wrap">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${values.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {values.is_active ? "Aktiv" : "Nofaol"}
        </span>
        {values.is_featured && (
          <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">Featured</span>
        )}
        {activeVariants.length > 0 && (
          <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-50 text-blue-600">
            {activeVariants.length} variant
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const productId = id ? Number(id) : null;
  const isEdit = Boolean(productId);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [lightbox, setLightbox] = useState<{ images: ProductImage[]; index: number } | null>(null);
  const [expandedVariants, setExpandedVariants] = useState(true);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ["product", productId],
    queryFn: () => api.get(`/api/v1/seller/products/${productId}`).then((r) => r.data),
    enabled: isEdit,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/api/v1/seller/categories").then((r) => r.data),
  });

  // ── Form ───────────────────────────────────────────────────────────────────

  const { register, handleSubmit, control, watch, reset, formState: { errors, isSubmitting } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name_uz: "",
      name_ru: "",
      description_uz: "",
      description_ru: "",
      category_id: null,
      sku: "",
      is_featured: false,
      is_active: true,
      sort_order: 0,
      variants: [{ name_uz: "Asosiy", price: 0, stock_quantity: 0, track_stock: true, is_default: true, is_active: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const formValues = watch();

  // Populate form when editing
  useEffect(() => {
    if (product) {
      reset({
        name_uz: product.name_uz,
        name_ru: product.name_ru ?? "",
        description_uz: product.description_uz ?? "",
        description_ru: product.description_ru ?? "",
        category_id: product.category_id,
        sku: product.sku ?? "",
        is_featured: product.is_featured,
        is_active: product.is_active,
        sort_order: product.sort_order,
        variants: product.variants.map((v) => ({
          id: v.id,
          name_uz: v.name_uz ?? "",
          name_ru: v.name_ru ?? "",
          sku: v.sku ?? "",
          price: v.price / 100,
          old_price: v.old_price != null ? v.old_price / 100 : null,
          stock_quantity: v.stock_quantity,
          track_stock: v.track_stock,
          is_default: v.is_default,
          is_active: v.is_active,
        })),
      });
    }
  }, [product, reset]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const uploadImageMutation = useMutation({
    mutationFn: ({ file }: { file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post(`/api/v1/seller/products/${productId}/images`, formData);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["product", productId] }); toast.success("Rasm qo'shildi"); },
    onError: () => toast.error("Rasmni yuklashda xatolik"),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) => api.delete(`/api/v1/seller/products/${productId}/images/${imageId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["product", productId] }); toast.success("Rasm o'chirildi"); },
    onError: () => toast.error("Xatolik"),
  });

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function onSubmit(data: ProductForm) {
    try {
      if (!isEdit) {
        // Create
        await api.post("/api/v1/seller/products", {
          name_uz: data.name_uz,
          name_ru: data.name_ru || "",
          description_uz: data.description_uz,
          description_ru: data.description_ru,
          category_id: data.category_id,
          sku: data.sku,
          is_featured: data.is_featured,
          sort_order: data.sort_order,
          variants: data.variants.map((v) => ({
            name_uz: v.name_uz,
            name_ru: v.name_ru,
            sku: v.sku,
            price: Math.round((v.price || 0) * 100),
            old_price: v.old_price != null ? Math.round(v.old_price * 100) : null,
            stock_quantity: v.stock_quantity,
            track_stock: v.track_stock,
            is_default: v.is_default,
          })),
        });
        toast.success("Mahsulot qo'shildi");
      } else {
        // Update product fields
        await api.patch(`/api/v1/seller/products/${productId}`, {
          name_uz: data.name_uz,
          name_ru: data.name_ru || "",
          description_uz: data.description_uz,
          description_ru: data.description_ru,
          category_id: data.category_id,
          sku: data.sku,
          is_featured: data.is_featured,
          is_active: data.is_active,
          sort_order: data.sort_order,
        });

        // Update/create variants
        for (const v of data.variants) {
          const variantPayload = {
            name_uz: v.name_uz,
            name_ru: v.name_ru,
            sku: v.sku,
            price: Math.round((v.price || 0) * 100),
            old_price: v.old_price != null ? Math.round(v.old_price * 100) : null,
            stock_quantity: v.stock_quantity,
            track_stock: v.track_stock,
            is_default: v.is_default,
            is_active: v.is_active,
          };
          if (v.id) {
            await api.patch(`/api/v1/seller/products/${productId}/variants/${v.id}`, variantPayload);
          } else {
            await api.post(`/api/v1/seller/products/${productId}/variants`, variantPayload);
          }
        }
        toast.success("Saqlandi");
      }

      qc.invalidateQueries({ queryKey: ["products"] });
      navigate("/products");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Xatolik yuz berdi");
    }
  }

  if (isEdit && productLoading) {
    return <div className="text-gray-400 p-8">Yuklanmoqda...</div>;
  }

  const images = product?.images ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/products")} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {isEdit ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex gap-6 items-start">
          {/* ── Left: Form ──────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Basic info */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-semibold text-gray-800 text-sm">Asosiy ma'lumotlar</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nomi (UZ) *</label>
                  <input {...register("name_uz")} className={inp()} placeholder="Mahsulot nomi" />
                  {errors.name_uz && <p className="text-red-500 text-xs mt-1">{errors.name_uz.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nomi (RU)</label>
                  <input {...register("name_ru")} className={inp()} placeholder="Название товара" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kategoriya</label>
                  <select {...register("category_id", { setValueAs: (v) => v === "" ? null : Number(v) })} className={inp()}>
                    <option value="">Tanlang</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name_uz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SKU (Article)</label>
                  <input {...register("sku")} className={inp()} placeholder="SKU-001" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tavsif (UZ)</label>
                <textarea {...register("description_uz")} rows={3} className={inp("resize-none")} placeholder="Mahsulot haqida..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tavsif (RU)</label>
                <textarea {...register("description_ru")} rows={2} className={inp("resize-none")} placeholder="Описание товара..." />
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 text-sm mb-4">Sozlamalar</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tartib raqami</label>
                  <input {...register("sort_order", { valueAsNumber: true })} type="number" className={inp()} placeholder="0" />
                </div>
                <div className="flex flex-col gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" {...register("is_active")} className="w-4 h-4 rounded accent-blue-600" />
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      <Eye size={14} /> Aktiv
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" {...register("is_featured")} className="w-4 h-4 rounded accent-yellow-500" />
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      <Star size={14} /> Featured
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Variants */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <button
                type="button"
                className="flex items-center justify-between w-full mb-3"
                onClick={() => setExpandedVariants(!expandedVariants)}
              >
                <h2 className="font-semibold text-gray-800 text-sm">
                  Variantlar ({fields.length})
                </h2>
                {expandedVariants ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {errors.variants && (
                <p className="text-red-500 text-xs mb-2">{errors.variants.message as string}</p>
              )}

              {expandedVariants && (
                <div className="space-y-3">
                  {fields.map((field, i) => (
                    <div key={field.id} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Variant {i + 1}</span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                            <input type="checkbox" {...register(`variants.${i}.is_active`)} className="w-3 h-3 accent-blue-600" />
                            Aktiv
                          </label>
                          <label className="flex items-center gap-1 text-xs text-yellow-600 cursor-pointer">
                            <input type="checkbox" {...register(`variants.${i}.is_default`)} className="w-3 h-3 accent-yellow-500" />
                            Asosiy
                          </label>
                          {fields.length > 1 && (
                            <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Nomi (UZ)</label>
                          <input {...register(`variants.${i}.name_uz`)} className={inp()} placeholder="Asosiy" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Nomi (RU)</label>
                          <input {...register(`variants.${i}.name_ru`)} className={inp()} placeholder="Основной" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Narx (so'm) *</label>
                          <input
                            {...register(`variants.${i}.price`, { valueAsNumber: true })}
                            type="number" min={0} step={100}
                            className={inp()}
                            placeholder="0"
                          />
                          {errors.variants?.[i]?.price && (
                            <p className="text-red-500 text-xs mt-0.5">{errors.variants[i].price?.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Eski narx (so'm)</label>
                          <input
                            {...register(`variants.${i}.old_price`, { setValueAs: (v) => v === "" || v == null ? null : Number(v) })}
                            type="number" min={0} step={100}
                            className={inp()}
                            placeholder="—"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Stok</label>
                          <input
                            {...register(`variants.${i}.stock_quantity`, { valueAsNumber: true })}
                            type="number" min={0}
                            className={inp()}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">SKU</label>
                          <input {...register(`variants.${i}.sku`)} className={inp()} placeholder="SKU-001-V1" />
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input type="checkbox" {...register(`variants.${i}.track_stock`)} className="w-4 h-4 accent-blue-600" />
                            Stokni kuzatish
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => append({ name_uz: "", name_ru: "", price: 0, stock_quantity: 0, track_stock: true, is_default: false, is_active: true })}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus size={14} /> Variant qo'shish
                  </button>
                </div>
              )}
            </div>

            {/* Photos (edit only) */}
            {isEdit && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-800 text-sm mb-3">Rasmlar</h2>
                <div className="flex gap-2 flex-wrap items-center">
                  {images.map((img, imgIdx) => (
                    <div key={img.id} className="relative group w-20 h-20">
                      <img
                        src={img.thumb_url || img.url}
                        alt=""
                        className="w-full h-full object-cover rounded-xl border border-gray-200 cursor-zoom-in"
                        onClick={() => setLightbox({ images, index: imgIdx })}
                      />
                      <button
                        type="button"
                        onClick={() => deleteImageMutation.mutate(img.id)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:text-blue-400 text-gray-400 transition-colors text-xs gap-1">
                    {uploadImageMutation.isPending ? (
                      <span className="text-[10px]">Yuklanmoqda...</span>
                    ) : (
                      <>
                        <Plus size={20} />
                        <span>Rasm</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImageMutation.mutate({ file });
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {images.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2">Rasm qo'shing — bu mahsulot ko'rinishini yaxshilaydi</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition text-sm"
              >
                {isSubmitting ? "Saqlanmoqda..." : isEdit ? "Saqlash" : "Qo'shish"}
              </button>
            </div>
          </div>

          {/* ── Right: Preview ───────────────────────────────────────────────── */}
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <ProductPreview values={formValues} categories={categories} images={images} />
          </div>
        </div>
      </form>

      {lightbox && (
        <Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
