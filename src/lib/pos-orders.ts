import { useEffect, useState } from "react";
import { onValue, ref, runTransaction, set } from "firebase/database";
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

/** Customer-facing payment choice. */
export type PaymentType = "CASH_ON_DELIVERY" | "INSTAPAY" | "WALLET";

export const PAYMENT_LABELS: Record<PaymentType, string> = {
  CASH_ON_DELIVERY: "الدفع عند الاستلام",
  INSTAPAY: "انستا باي",
  WALLET: "محفظة إلكترونية",
};

export type SubmitOrderInput = {
  title?: string;
  explanatoryMessage?: string;
  cart: CartItem[];
  total: number;
  paymentType: PaymentType;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  /** Cash on delivery only. */
  amountPaid?: number | null;
  changeDue?: number | null;
  /** Digital payments only. */
  paymentAccount?: string | null;
  paymentProofImage?: string | null;
};

const LAST_ORDER_KEY = "babrizq:last-order-id";
const MY_ORDERS_KEY = "babrizq:my-orders";
const FIRST_ORDER_NUMBER = 1000;

export type MyOrderRef = { id: string; orderNumber: number };

function readMyOrders(): MyOrderRef[] {
  try {
    const raw = localStorage.getItem(MY_ORDERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rememberOrder(entry: MyOrderRef) {
  try {
    const next = [entry, ...readMyOrders().filter((o) => o.id !== entry.id)].slice(0, 30);
    localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(next));
    localStorage.setItem(LAST_ORDER_KEY, entry.id);
  } catch {
    /* storage may be unavailable */
  }
}

/** Short sequential, human friendly order number (#1001, #1002 ...). */
async function nextOrderNumber(): Promise<number> {
  const db = await firebaseDb();
  const result = await runTransaction(ref(db, "counters/orderNumber"), (current) =>
    typeof current === "number" && current >= FIRST_ORDER_NUMBER ? current + 1 : FIRST_ORDER_NUMBER + 1,
  );
  const value = result.snapshot.val();
  return typeof value === "number" ? value : FIRST_ORDER_NUMBER + 1;
}

/** Writes the order to orders/{orderId} exactly as the Android POS expects. */
export async function submitOrder(input: SubmitOrderInput) {
  const orderId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const orderNumber = await nextOrderNumber();
  const isCod = input.paymentType === "CASH_ON_DELIVERY";

  const payload = {
    id: orderId,
    orderNumber,
    title: input.title ?? `طلب #${orderNumber}`,
    explanatoryMessage: input.explanatoryMessage ?? "",
    items: input.cart.map((i) => ({
      productId: String(i.product.id),
      name: i.product.name,
      price: Number(i.product.price),
      quantity: Number(i.quantity),
    })),
    totalAmount: Math.round(input.total * 100) / 100,
    status: "PENDING",
    paymentMethod: isCod ? "PAY_ON_DELIVERY" : "PAY_NOW",
    paymentType: input.paymentType,
    paymentTypeLabel: PAYMENT_LABELS[input.paymentType],
    paymentAccount: input.paymentAccount ?? null,
    amountPaid: isCod ? (input.amountPaid ?? null) : Math.round(input.total * 100) / 100,
    changeDue: isCod ? (input.changeDue ?? null) : 0,
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

  rememberOrder({ id: orderId, orderNumber });

  return { orderId, orderNumber };
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

export type TrackedOrder = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  orderTime: number;
  totalAmount: number;
  paymentTypeLabel?: string;
};

/** Live list of the orders placed from this device. */
export function useMyOrders() {
  const [refs, setRefs] = useState<MyOrderRef[]>([]);
  const [orders, setOrders] = useState<Record<string, TrackedOrder>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRefs(readMyOrders());
  }, []);

  useEffect(() => {
    if (refs.length === 0) {
      setLoading(false);
      return;
    }
    let active = true;
    const cleanups: Array<() => void> = [];

    firebaseDb().then((db) => {
      if (!active) return;
      setLoading(false);
      refs.forEach((r) => {
        cleanups.push(
          onValue(ref(db, `orders/${r.id}`), (snap) => {
            const value = snap.val();
            if (!value) return;
            setOrders((prev) => ({
              ...prev,
              [r.id]: {
                id: r.id,
                orderNumber: Number(value.orderNumber) || r.orderNumber,
                status: (value.status as OrderStatus) ?? "PENDING",
                orderTime: Number(value.orderTime) || Date.now(),
                totalAmount: Number(value.totalAmount) || 0,
                paymentTypeLabel: value.paymentTypeLabel ?? undefined,
              },
            }));
          }),
        );
      });
    });

    return () => {
      active = false;
      cleanups.forEach((fn) => fn());
    };
  }, [refs]);

  const list = refs
    .map((r) => orders[r.id])
    .filter((o): o is TrackedOrder => !!o)
    .sort((a, b) => b.orderTime - a.orderTime);

  return { orders: list, loading, hasLocalOrders: refs.length > 0 };
}

/** "5 دقيقة" / "1 س 15 د" since the order was placed. */
export function formatElapsed(fromMs: number, nowMs: number) {
  const mins = Math.max(0, Math.floor((nowMs - fromMs) / 60000));
  if (mins < 1) return "الآن";
  if (mins < 60) return `${mins} دقيقة`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} ساعة` : `${h} س ${m} د`;
}
