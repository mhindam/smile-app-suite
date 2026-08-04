import { useEffect, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { firebaseDb } from "./firebase";
import type { CartItem } from "@/data/menu";

export type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "قيد الانتظار",
  PREPARING: "جاري التحضير",
  ON_THE_WAY: "في الطريق",
  DELIVERED: "تم التسليم",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

export type SubmitOrderInput = {
  title?: string;
  explanatoryMessage?: string;
  cart: CartItem[];
  total: number;
  paymentMethod: "PAY_ON_DELIVERY" | "PAY_NOW";
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentProofImage?: string | null;
};

const LAST_ORDER_KEY = "babrizq:last-order-id";

/** Writes the order to orders/{orderId} exactly as the Android POS expects. */
export async function submitOrder(input: SubmitOrderInput) {
  const orderId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const payload = {
    id: orderId,
    title: input.title ?? "Web Order",
    explanatoryMessage: input.explanatoryMessage ?? "",
    items: input.cart.map((i) => ({
      productId: String(i.product.id),
      name: i.product.name,
      price: Number(i.product.price),
      quantity: Number(i.quantity),
    })),
    totalAmount: Math.round(input.total * 100) / 100,
    status: "PENDING",
    paymentMethod: input.paymentMethod,
    cashierPaymentMethod: null,
    isPaid: false,
    orderTime: Date.now(),
    prepStartTime: null,
    rating: null,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerAddress: input.customerAddress,
    paymentProofImage: input.paymentProofImage ?? null,
  };

  const db = await firebaseDb();
  await set(ref(db, `orders/${orderId}`), payload);

  try {
    localStorage.setItem(LAST_ORDER_KEY, orderId);
  } catch {
    /* storage may be unavailable */
  }

  return orderId;
}

export function getLastOrderId() {
  try {
    return localStorage.getItem(LAST_ORDER_KEY);
  } catch {
    return null;
  }
}

/** Live status of a single order. */
export function useOrderStatus(orderId: string | null) {
  const [status, setStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (!orderId) {
      setStatus(null);
      return;
    }
    let unsub: (() => void) | undefined;
    let active = true;

    firebaseDb().then((db) => {
      if (!active) return;
      unsub = onValue(ref(db, `orders/${orderId}/status`), (snap) => {
        const value = snap.val();
        setStatus(typeof value === "string" ? (value as OrderStatus) : null);
      });
    });

    return () => {
      active = false;
      unsub?.();
    };
  }, [orderId]);

  return status;
}
