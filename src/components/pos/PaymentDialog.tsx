import { useState } from "react";
import { Banknote, CreditCard, Smartphone, UserRound, CheckCircle2 } from "lucide-react";
import { formatEgp } from "@/data/menu";

const methods = [
  { id: "CASH", label: "كاش", icon: Banknote },
  { id: "WALLET", label: "محفظة", icon: Smartphone },
  { id: "INSTAPAY", label: "انستا باي", icon: CreditCard },
  { id: "CREDIT", label: "آجل", icon: UserRound },
] as const;

export function PaymentDialog({
  grandTotal,
  busy = false,
  onDismiss,
  onComplete,
}: {
  grandTotal: number;
  busy?: boolean;
  onDismiss: () => void;
  onComplete: (method: string) => void;
}) {
  const [method, setMethod] = useState<string>("CASH");

  const [paid, setPaid] = useState<string>(String(grandTotal));
  const change = (Number(paid) || 0) - grandTotal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary">إتمام الدفع</h2>
          <span className="text-2xl font-bold text-destructive">{formatEgp(grandTotal)}</span>
        </div>

        <p className="mt-6 text-sm font-semibold text-on-surface-variant">طريقة الدفع</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {methods.map((m) => {
            const Icon = m.icon;
            const active = m.id === method;
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface-variant text-on-surface-variant hover:bg-primary-container"
                }`}
              >
                <Icon className="size-4" />
                {m.label}
              </button>
            );
          })}
        </div>

        {method === "CASH" && (
          <div className="mt-6">
            <label className="text-sm font-semibold text-on-surface-variant">المبلغ المدفوع</label>
            <input
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
              inputMode="decimal"
              className="mt-2 w-full rounded-2xl border border-input bg-surface px-4 py-3 text-lg font-bold text-on-surface outline-none focus:border-primary"
            />
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-on-surface-variant">الباقي</span>
              <span className="font-bold text-primary">
                {formatEgp(change > 0 ? Math.round(change * 100) / 100 : 0)}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 rounded-2xl border border-input px-4 py-3 text-sm font-semibold text-primary"
          >
            إلغاء
          </button>
          <button
            onClick={() => onComplete(method)}
            disabled={busy}
            className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-base font-bold text-primary-foreground disabled:opacity-50"
          >
            <CheckCircle2 className="size-5" />
            {busy ? "جارٍ الإرسال..." : "تأكيد الدفع"}
          </button>

        </div>
      </div>
    </div>
  );
}
