import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../shared/api/client";
import { Plus, Edit2, Trash2, ChevronRight, FolderOpen } from "lucide-react";
import { toast } from "sonner";

const categorySchema = z.object({
  name_uz: z.string().min(1, "Nomni kiriting"),
  name_ru: z.string().min(1, "Ru nomni kiriting"),
  parent_id: z.number().nullable().optional(),
});
type CategoryForm = z.infer<typeof categorySchema>;

interface Category {
  id: number;
  name_uz: string;
  name_ru: string;
  parent_id: number | null;
  slug: string;
  product_count?: number;
  children?: Category[];
}

export default function CatalogPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; editing?: Category }>({ open: false });
  const [parentFilter, setParentFilter] = useState<number | null>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/api/v1/seller/categories").then((r) => r.data),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryForm) => api.post("/api/v1/seller/categories", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); closeModal(); toast.success("Kategoriya qo'shildi"); },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryForm }) =>
      api.patch(`/api/v1/seller/categories/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); closeModal(); toast.success("Yangilandi"); },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/seller/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("O'chirildi"); },
    onError: () => toast.error("O'chirib bo'lmadi (mahsulotlar bor bo'lishi mumkin)"),
  });

  function openAdd(parentId?: number) {
    reset({ name_uz: "", name_ru: "", parent_id: parentId ?? null });
    setModal({ open: true });
  }

  function openEdit(cat: Category) {
    reset({ name_uz: cat.name_uz, name_ru: cat.name_ru, parent_id: cat.parent_id });
    setModal({ open: true, editing: cat });
  }

  function closeModal() {
    setModal({ open: false });
    reset();
  }

  function onSubmit(data: CategoryForm) {
    if (modal.editing) {
      updateMutation.mutate({ id: modal.editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const topLevel = categories.filter((c) => c.parent_id === null);
  const children = (parentId: number) => categories.filter((c) => c.parent_id === parentId);

  if (isLoading) return <div className="text-gray-400">Yuklanmoqda...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Katalog</h1>
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} /> Kategoriya qo'shish
        </button>
      </div>

      {topLevel.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <FolderOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">Hozircha kategoriya yo'q</p>
          <button onClick={() => openAdd()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Birinchi kategoriyani qo'shish
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {topLevel.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setParentFilter(parentFilter === cat.id ? null : cat.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ChevronRight
                      size={16}
                      className={`transition-transform ${parentFilter === cat.id ? "rotate-90" : ""}`}
                    />
                  </button>
                  <div>
                    <div className="font-medium text-gray-900">{cat.name_uz}</div>
                    <div className="text-xs text-gray-400">{cat.name_ru}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openAdd(cat.id)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                    title="Ichki kategoriya"
                  >
                    <Plus size={14} />
                  </button>
                  <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => { if (confirm("O'chirishni tasdiqlaysizmi?")) deleteMutation.mutate(cat.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {parentFilter === cat.id && children(cat.id).length > 0 && (
                <div className="border-t border-gray-50 bg-gray-50">
                  {children(cat.id).map((child) => (
                    <div key={child.id} className="flex items-center justify-between px-4 py-2.5 pl-10 border-b border-gray-100 last:border-0">
                      <div>
                        <span className="text-sm text-gray-800">{child.name_uz}</span>
                        <span className="text-xs text-gray-400 ml-2">{child.name_ru}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(child)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => { if (confirm("O'chirishni tasdiqlaysizmi?")) deleteMutation.mutate(child.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                {modal.editing ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}
              </h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomi (UZ)</label>
                <input
                  {...register("name_uz")}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Elektronika"
                />
                {errors.name_uz && <p className="text-red-500 text-xs mt-1">{errors.name_uz.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomi (RU)</label>
                <input
                  {...register("name_ru")}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Электроника"
                />
                {errors.name_ru && <p className="text-red-500 text-xs mt-1">{errors.name_ru.message}</p>}
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
