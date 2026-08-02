import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/data/menu";

export type PlaceOrderInput = {
  cart: CartItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  qrTitle?: string | undefined;
  qrMessage?: string | undefined;
  customerName?: string | undefined;
  customerPhone?: string | undefined;
  note?: string | undefined;
};

export function makeOrderCode() {
  return `W-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Sends a customer order (placed from the QR web page) to the shared backend.
 * The Android POS app polls /api/public/pos/orders and picks it up.
 */
export async function placeOrder(input: PlaceOrderInput) {
  const code = makeOrderCode();

  const { error } = await supabase.from("orders").insert({
    code,
    qr_title: input.qrTitle ?? null,
    qr_message: input.qrMessage ?? null,
    customer_name: input.customerName?.trim() || null,
    customer_phone: input.customerPhone?.trim() || null,
    note: input.note?.trim() || null,
    items: input.cart.map((i) => ({
      id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
      total: Math.round(i.product.price * i.quantity * 100) / 100,
    })),
    subtotal: Math.round(input.subtotal * 100) / 100,
    total: Math.round(input.total * 100) / 100,
    payment_method: input.paymentMethod.toLowerCase(),
    status: "new",
    source: "web",
  });

  if (error) throw new Error(error.message);
  return code;
}
