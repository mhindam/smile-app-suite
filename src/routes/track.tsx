import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Clock, ClipboardList } from "lucide-react";
import { formatEgp } from "@/data/menu";
import { formatElapsed, STATUS_LABELS, useMyOrders, type OrderStatus } from "@/lib/pos-orders";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "تتبع الطلبات — باب رزق" },
      {
        name: "description",
        content: "تابع حالة طلباتك من باب رزق لحظة بلحظة: رقم الطلب، وقت الطلب والحالة الحالية.",
      },
      { property: "og:title", content: "تتبع الطلبات — باب رزق" },
      {
        property: "og:description",
        content: "صفحة تتبع طلبات باب رزق مع تحديث فوري لحالة كل طلب.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrackPage,
});

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-secondary-container text-on-secondary-container",
  PREPARING: "bg-primary-container text-on-primary-container",
  ON_THE_WAY: "bg-primary-container text-on-primary-container",
  DELIVERED: "bg-primary text-primary-foreground",
  COMPLETED: "bg-primary text-primary-foreground",
  CANCELLED: "bg-destructive/10 text-destructive",
};

function TrackPage() {
  const { orders, loading, hasLocalOrders } = useMyOrders();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-10 text-on-surface">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-surface px-4 py-4 shadow-card">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold">تتبع الطلبات</h1>
          <p className="text-xs text-on-surface-variant">حالة طلباتك بتتحدث تلقائياً</p>
        </div>
        <Link
          to="/order"
          className="flex shrink-0 items-center gap-2 rounded-2xl bg-secondary-container px-3 py-2 text-sm font-bold text-on-secondary-container"
        >
          <ArrowRight className="size-4" />
          المنيو
        </Link>
      </header>

      <main className="space-y-3 p-4">
        {loading && hasLocalOrders && (
          <p className="py-10 text-center text-sm text-on-surface-variant">جاري تحميل الطلبات...</p>
        )}

        {!hasLocalOrders && (
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-surface p-10 text-center shadow-card">
            <ClipboardList className="size-12 text-on-surface-variant" />
            <p className="font-bold">لا توجد طلبات بعد</p>
            <Link
              to="/order"
              className="rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground"
            >
              اطلب الآن
            </Link>
          </div>
        )}

        {orders.map((o) => (
          <article key={o.id} className="rounded-3xl bg-surface p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-2xl font-black text-primary">#{o.orderNumber}</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {new Date(o.orderTime).toLocaleString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[o.status]}`}
              >
                {STATUS_LABELS[o.status]}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="flex items-center gap-2 font-bold text-on-surface-variant">
                <Clock className="size-4" />
                {formatElapsed(o.orderTime, now)}
              </span>
              <span className="font-extrabold">{formatEgp(o.totalAmount)}</span>
            </div>
            {o.paymentTypeLabel && (
              <p className="mt-2 text-xs text-on-surface-variant">{o.paymentTypeLabel}</p>
            )}
          </article>
        ))}
      </main>
    </div>
  );
}
