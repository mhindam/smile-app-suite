export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  barcode?: string;
  badge?: string;
  expiryDate?: number;
};

export type Category = {
  name: string;
  icon?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export const formatEgp = (value: number) =>
  `${Number.isInteger(value) ? value : value.toFixed(2)} ج.م`;
