export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  badge?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export const categories: string[] = [
  "قهوة حارة",
  "قهوة باردة",
  "مخبوزات",
  "مشروبات",
  "حلويات",
];

export const products: Product[] = [
  {
    id: 1,
    name: "إسبريسو",
    price: 25,
    category: "قهوة حارة",
    imageUrl: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400",
    badge: "الأكثر مبيعاً",
  },
  {
    id: 2,
    name: "كابتشينو",
    price: 35,
    category: "قهوة حارة",
    imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=400",
  },
  {
    id: 3,
    name: "لاتيه",
    price: 40,
    category: "قهوة حارة",
    imageUrl: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400",
  },
  {
    id: 4,
    name: "موكا",
    price: 45,
    category: "قهوة حارة",
    imageUrl: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400",
  },
  {
    id: 5,
    name: "أمريكانو",
    price: 30,
    category: "قهوة حارة",
    imageUrl: "https://images.unsplash.com/photo-1551030173-122aabc4489c?w=400",
  },
  {
    id: 6,
    name: "فلات وايت",
    price: 45,
    category: "قهوة حارة",
    imageUrl: "https://images.unsplash.com/photo-1585494156145-1c60a4fe952b?w=400",
    badge: "جديد",
  },
  {
    id: 7,
    name: "قهوة تركية",
    price: 20,
    category: "قهوة حارة",
    imageUrl: "https://images.unsplash.com/photo-1595089201083-d9ea24d27bf9?w=400",
  },
  {
    id: 8,
    name: "آيس كوفي",
    price: 35,
    category: "قهوة باردة",
    imageUrl: "https://images.unsplash.com/photo-1517701550927-30cfcb64ac45?w=400",
  },
  {
    id: 9,
    name: "آيس لاتيه",
    price: 45,
    category: "قهوة باردة",
    imageUrl: "https://images.unsplash.com/photo-1499961024600-ad094db620dd?w=400",
    badge: "عرض",
  },
  {
    id: 10,
    name: "فرابوتشينو",
    price: 55,
    category: "قهوة باردة",
    imageUrl: "https://images.unsplash.com/photo-1627814429983-d3d630d4db02?w=400",
  },
  {
    id: 11,
    name: "كرواسون",
    price: 25,
    category: "مخبوزات",
    imageUrl: "https://images.unsplash.com/photo-1555507036-ab1e4006a8a0?w=400",
  },
  {
    id: 12,
    name: "بان كيك",
    price: 45,
    category: "حلويات",
    imageUrl: "https://images.unsplash.com/photo-1528207776546-3221869e5d48?w=400",
  },
  {
    id: 13,
    name: "موهيتو فراولة",
    price: 35,
    category: "مشروبات",
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400",
  },
  {
    id: 14,
    name: "ماء",
    price: 10,
    category: "مشروبات",
    imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400",
  },
];

export const formatEgp = (value: number) =>
  `${Number.isInteger(value) ? value : value.toFixed(2)} ج.م`;
