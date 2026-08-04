import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Check,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { formatEgp, type CartItem, type Product } from "@/data/menu";
import { useMenu } from "@/lib/useMenu";
import { STATUS_LABELS, submitOrder, useOrderStatus, type OrderStatus } from "@/lib/pos-orders";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "باب رزق — اطلب أونلاين" },
      {
        name: "description",
        content:
          "اطلب من منيو باب رزق مباشرة من موبايلك: اختر أصنافك، أضف بياناتك واختر طريقة الدفع بسهولة.",
      },
      { property: "og:title", content: "باب رزق — اطلب أونلاين" },
      {
        property: "og:description",
        content: "منيو باب رزق للطلب الخارجي: أصناف متنوعة، دفع عند الاستلام أو دفع إلكتروني.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderPage,
});

const ALL = "الكل";
const PAY_DETAILS = {
  instapay: { label: "انستا باي", value: "babrizq@instapay" },
  wallet: { label: "المحفظة الإلكترونية", value: "0100 000 0000" },
} as const;

type PayNowMethod = keyof typeof PAY_DETAILS;

const TRACK_STEPS = [
  "PENDING",
  "PREPARING",
  "ON_THE_WAY",
  "DELIVERED",
  "COMPLETED",
] as const satisfies readonly OrderStatus[];

function OrderPage() {
  const [category, setCategory] = useState(ALL);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<"cod" | "now" | null>(null);
  const [payNow, setPayNow] = useState<PayNowMethod | null>(null);
  const [paidClicked, setPaidClicked] = useState(false);
  const [receipt, setReceipt] = useState<{ name: string; dataUrl: string } | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { categories: menuCategories, products, loading: menuLoading, error: menuError } = useMenu();
  const categories = useMemo(() => menuCategories.map((c) => c.name), [menuCategories]);
  const orderStatus = useOrderStatus(orderId);

  const list = useMemo(
    () => (category === ALL ? products : products.filter((p) => p.category === category)),
    [products, category],
  );

  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const add = (product: Product) =>
    setCart((items) =>
      items.some((i) => i.product.id === product.id)
        ? items.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...items, { product, quantity: 1 }],
    );

  const step = (id: number, delta: number) =>
    setCart((items) =>
      items.flatMap((i) =>
        i.product.id === id
          ? i.quantity + delta > 0
            ? [{ ...i, quantity: i.quantity + delta }]
            : []
          : [i],
      ),
    );

  const canConfirm =
    cart.length > 0 &&
    (payment === "cod" || (payment === "now" && !!payNow && !!receipt)) &&
    !submitting;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("read error"));
      reader.readAsDataURL(file);
    });
    setReceipt({ name: file.name, dataUrl });
  }

  async function confirmOrder() {
    setError("");
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("من فضلك اكمل الاسم ورقم الهاتف والعنوان");
      return;
    }
    if (payment === "now" && !receipt) {
      setError("من فضلك ارفق إيصال الدفع");
      return;
    }
    setSubmitting(true);
    try {
      const id = await submitOrder({
        cart,
        total,
        paymentMethod: payment === "cod" ? "PAY_ON_DELIVERY" : "PAY_NOW",
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerAddress: address.trim(),
        explanatoryMessage: payNow ? `دفع عبر ${PAY_DETAILS[payNow].label}` : "",
        paymentProofImage: receipt?.dataUrl ?? null,
      });
      setOrderId(id);
      setOpen(false);
      setCart([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر إرسال الطلب، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  }

  if (orderId) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center"
      >
        <div className="animate-in zoom-in-50 duration-500 flex size-28 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-fab">
          <Check className="size-16" strokeWidth={3} />
        </div>
        <h1 className="text-2xl font-extrabold">تم استلام طلبك بنجاح!</h1>
        <p className="text-on-surface-variant">
          احتفظ برقم الطلب لمتابعة حالته مع الفرع
        </p>
        <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-card">
          <p className="text-sm text-on-surface-variant">رقم الطلب</p>
          <p className="mt-2 break-all text-4xl font-black tracking-tight text-primary sm:text-5xl">
            #{orderId.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Live tracking straight from the POS */}
        <div className="w-full max-w-sm rounded-3xl bg-surface p-6 text-right shadow-card">
          <p className="mb-4 text-sm font-bold text-on-surface-variant">حالة الطلب</p>
          <ol className="space-y-3">
            {TRACK_STEPS.map((step, idx) => {
              const current = orderStatus ?? "PENDING";
              const currentIdx = TRACK_STEPS.indexOf(current as (typeof TRACK_STEPS)[number]);
              const done = currentIdx >= idx && currentIdx !== -1;
              return (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      done
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary-container text-on-surface-variant"
                    }`}
                  >
                    {done ? <Check className="size-4" strokeWidth={3} /> : idx + 1}
                  </span>
                  <span className={done ? "font-bold" : "text-on-surface-variant"}>
                    {STATUS_LABELS[step]}
                  </span>
                </li>
              );
            })}
          </ol>
          {orderStatus === "CANCELLED" && (
            <p className="mt-4 font-bold text-destructive">{STATUS_LABELS.CANCELLED}</p>
          )}
        </div>
        <button
          onClick={() => {
            setOrderId(null);
            setPayment(null);
            setPayNow(null);
            setPaidClicked(false);
            setReceipt(null);
          }}
          className="rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground"
        >
          طلب جديد
        </button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-28 text-on-surface">
      <header className="sticky top-0 z-30 bg-surface px-4 py-4 shadow-card">
        <h1 className="text-xl font-extrabold">باب رزق</h1>
        <p className="text-xs text-on-surface-variant">اطلب الآن ووصلك لحد باب البيت</p>
      </header>

      <nav className="sticky top-[68px] z-20 flex gap-2 overflow-x-auto bg-background px-4 py-3">
        {[ALL, ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              cat === category
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-on-surface-variant"
            }`}
          >
            {cat}
          </button>
        ))}
      </nav>

      {(menuLoading || menuError || products.length === 0) && (
        <p className="px-6 py-8 text-center text-sm text-on-surface-variant">
          {menuLoading
            ? "جاري تحميل المنيو..."
            : menuError
              ? "تعذّر تحميل المنيو، حاول مرة أخرى"
              : "لا توجد أصناف متاحة حالياً"}
        </p>
      )}

      <main className="grid grid-cols-2 gap-3 px-4 pt-1 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((p) => (
          <button
            key={p.id}
            onClick={() => add(p)}
            className="overflow-hidden rounded-3xl bg-surface text-right shadow-card transition-transform active:scale-[0.98]"
          >
            <div className="relative aspect-[1.25] w-full bg-secondary-container">
              <img
                src={p.imageUrl}
                alt={p.name}
                loading="lazy"
                className="size-full object-cover"
              />
              {p.badge && (
                <span className="absolute right-0 top-0 rounded-bl-2xl bg-secondary px-2 py-1 text-[11px] font-bold text-secondary-foreground">
                  {p.badge}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate font-bold">{p.name}</p>
                <p className="mt-1 text-sm font-bold text-primary">{formatEgp(p.price)}</p>
              </div>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Plus className="size-4" />
              </span>
            </div>
          </button>
        ))}
      </main>

      {/* Floating cart bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 p-4 transition-all duration-300 ${
          count > 0 ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
        }`}
      >
        <button
          onClick={() => setOpen(true)}
          className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-3xl bg-primary px-5 py-4 text-primary-foreground shadow-fab"
        >
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
            <ShoppingBag className="size-5" />
          </span>
          <span className="min-w-0 text-right">
            <span className="block text-xs opacity-80">{count} عنصر</span>
            <span className="block truncate font-extrabold">{formatEgp(total)}</span>
          </span>
          <span className="shrink-0 rounded-2xl bg-primary-foreground/15 px-4 py-2 text-sm font-bold">
            إتمام الطلب
          </span>
        </button>
      </div>

      {/* Checkout modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-foreground/50 animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-surface shadow-sheet animate-in slide-in-from-bottom duration-300"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4">
              <h2 className="truncate text-lg font-extrabold">إتمام الطلب</h2>
              <button
                aria-label="إغلاق"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-full p-1 text-on-surface-variant"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="h-px bg-surface-variant" />

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* Cart review */}
              <section className="space-y-3">
                {cart.length === 0 && (
                  <p className="py-6 text-center text-on-surface-variant">السلة فارغة</p>
                )}
                {cart.map((i) => (
                  <div key={i.product.id} className="flex items-center gap-3">
                    <img
                      src={i.product.imageUrl}
                      alt={i.product.name}
                      className="size-14 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{i.product.name}</p>
                      <p className="text-sm font-bold text-primary">
                        {formatEgp(i.product.price * i.quantity)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        aria-label="إنقاص"
                        onClick={() => step(i.product.id, -1)}
                        className="flex size-8 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container"
                      >
                        {i.quantity === 1 ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
                      </button>
                      <span className="min-w-6 text-center font-bold">{i.quantity}</span>
                      <button
                        aria-label="زيادة"
                        onClick={() => step(i.product.id, 1)}
                        className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </section>

              <div className="flex justify-between rounded-2xl bg-surface-variant/50 px-4 py-3 text-lg font-extrabold">
                <span>الإجمالي</span>
                <span className="text-primary">{formatEgp(total)}</span>
              </div>

              {/* Customer details */}
              <section className="space-y-3">
                <h3 className="font-bold">بيانات العميل</h3>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  placeholder="الاسم *"
                  className="w-full rounded-2xl border border-input bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  maxLength={20}
                  placeholder="رقم الهاتف *"
                  className="w-full rounded-2xl border border-input bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={300}
                  rows={2}
                  placeholder="العنوان بالتفصيل *"
                  className="w-full resize-none rounded-2xl border border-input bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </section>

              {/* Payment */}
              <section className="space-y-3">
                <h3 className="font-bold">طريقة الدفع</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setPayment("cod");
                      setPayNow(null);
                      setPaidClicked(false);
                      setReceipt(null);
                    }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-bold transition-colors ${
                      payment === "cod"
                        ? "border-primary bg-primary-container text-on-primary-container"
                        : "border-border text-on-surface-variant"
                    }`}
                  >
                    <Truck className="size-6" />
                    الدفع عند الاستلام
                  </button>
                  <button
                    onClick={() => setPayment("now")}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-bold transition-colors ${
                      payment === "now"
                        ? "border-primary bg-primary-container text-on-primary-container"
                        : "border-border text-on-surface-variant"
                    }`}
                  >
                    <CreditCard className="size-6" />
                    الدفع الآن
                  </button>
                </div>

                {payment === "now" && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-3">
                      {(Object.keys(PAY_DETAILS) as PayNowMethod[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            setPayNow(m);
                            setPaidClicked(false);
                            setReceipt(null);
                          }}
                          className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition-colors ${
                            payNow === m
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-on-surface-variant"
                          }`}
                        >
                          <Wallet className="size-4" />
                          {PAY_DETAILS[m].label}
                        </button>
                      ))}
                    </div>

                    {payNow && (
                      <div className="space-y-3 rounded-2xl bg-secondary-container p-4 text-on-secondary-container animate-in fade-in duration-300">
                        <p className="text-sm font-bold">
                          برجاء التحويل على {PAY_DETAILS[payNow].label}:
                        </p>
                        <p className="text-lg font-extrabold" dir="ltr">
                          {PAY_DETAILS[payNow].value}
                        </p>
                        {!paidClicked ? (
                          <button
                            onClick={() => setPaidClicked(true)}
                            className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground"
                          >
                            تم الدفع
                          </button>
                        ) : (
                          <div className="space-y-2 animate-in fade-in duration-300">
                            <button
                              onClick={() => fileRef.current?.click()}
                              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary bg-surface py-3 text-sm font-bold text-primary"
                            >
                              <Upload className="size-4" />
                              {receipt ? "تغيير الإيصال" : "إرفاق إيصال الدفع"}
                            </button>
                            <input
                              ref={fileRef}
                              type="file"
                              accept="image/*"
                              onChange={onFile}
                              className="hidden"
                            />
                            {receipt && (
                              <div className="flex items-center gap-3 rounded-2xl bg-surface p-2">
                                <img
                                  src={receipt.dataUrl}
                                  alt="إيصال الدفع"
                                  className="size-12 rounded-xl object-cover"
                                />
                                <p className="min-w-0 flex-1 truncate text-xs">{receipt.name}</p>
                                <Check className="size-5 shrink-0 text-primary" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {error && (
                <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
                  {error}
                </p>
              )}
            </div>

            <div className="border-t border-border p-5">
              <button
                disabled={!canConfirm}
                onClick={confirmOrder}
                className="w-full rounded-2xl bg-primary py-4 font-extrabold text-primary-foreground transition-opacity disabled:opacity-40"
              >
                {submitting ? "جاري الإرسال..." : "تأكيد الطلب"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
