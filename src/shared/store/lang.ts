import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lang = "uz" | "ru";

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useSellerLang = create<LangState>()(
  persist(
    (set) => ({
      lang: "uz",
      setLang: (lang) => set({ lang }),
    }),
    { name: "seller-lang" }
  )
);

export const sellerT = {
  dashboard:    { uz: "Dashboard",    ru: "Дашборд" },
  catalog:      { uz: "Katalog",      ru: "Каталог" },
  products:     { uz: "Mahsulotlar",  ru: "Товары" },
  orders:       { uz: "Buyurtmalar",  ru: "Заказы" },
  settings:     { uz: "Sozlamalar",   ru: "Настройки" },
  logout:       { uz: "Chiqish",      ru: "Выйти" },
  loginTitle:   { uz: "Seller Cabinet", ru: "Кабинет продавца" },
  loginSubtitle:{ uz: "Do'koningizni boshqaring", ru: "Управляйте своим магазином" },
  email:        { uz: "Email",        ru: "Email" },
  password:     { uz: "Parol",        ru: "Пароль" },
  loginBtn:     { uz: "Kirish",       ru: "Войти" },
  loggingIn:    { uz: "Kirish...",    ru: "Вход..." },
} as const;

export const st = (key: keyof typeof sellerT, lang: Lang): string => sellerT[key][lang];
