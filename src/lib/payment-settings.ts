import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { firebaseDb } from "./firebase";

export type PaymentSettings = {
  instapayAccount: string;
  instapayQrUrl: string | null;
  walletNumber: string;
};

const FALLBACK: PaymentSettings = {
  instapayAccount: "babrizq@instapay",
  instapayQrUrl: null,
  walletNumber: "0100 000 0000",
};

/** Payment accounts configured from the Android POS settings (settings/payment). */
export function usePaymentSettings(): PaymentSettings {
  const [settings, setSettings] = useState<PaymentSettings>(FALLBACK);

  useEffect(() => {
    let active = true;
    let unsub: (() => void) | undefined;

    firebaseDb().then((db) => {
      if (!active) return;
      unsub = onValue(ref(db, "settings/payment"), (snap) => {
        const v = snap.val() as Record<string, unknown> | null;
        if (!v) return;
        setSettings({
          instapayAccount: String(v["instapayAccount"] ?? v["instapay"] ?? FALLBACK.instapayAccount),
          instapayQrUrl: v["instapayQrUrl"] ? String(v["instapayQrUrl"]) : null,
          walletNumber: String(v["walletNumber"] ?? v["wallet"] ?? FALLBACK.walletNumber),
        });
      });
    });

    return () => {
      active = false;
      unsub?.();
    };
  }, []);

  return settings;
}
