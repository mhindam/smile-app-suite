import React, { useState } from 'react';

type OrderResponse = {
  success: boolean;
  orderId?: string;
  [k: string]: any;
};

const round6 = (n: number) => Number(n).toFixed(6);

export default function Checkout() {
  const [address, setAddress] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  async function useMyLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not available in your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = round6(pos.coords.latitude);
        const lng = round6(pos.coords.longitude);
        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
        setAddress(mapsUrl);
      },
      (err) => {
        alert('Unable to get location: ' + err.message);
      },
      { timeout: 10000 }
    );
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!address) {
      if (!confirm('Address is empty. Do you want to submit anyway?')) return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerAddress: address }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error: ${res.status} ${text}`);
      }

      const body: OrderResponse = await res.json();

      if (body && body.success && body.orderId) {
        alert(`Thank you! Your Order ID is ${body.orderId}. Use it to track your order.`);
      } else if (body && body.orderId) {
        alert(`Thank you! Your Order ID is ${body.orderId}. Use it to track your order.`);
      } else {
        alert('Order placed — but no Order ID was returned by the server.');
      }
    } catch (err: any) {
      alert('Failed to submit order: ' + (err?.message ?? String(err)));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label style={{ display: 'block', marginBottom: 8 }}>
        Address
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <input
            style={{ flex: 1 }}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter address or use location"
            aria-label="Address"
          />
          <button type="button" onClick={useMyLocation}>
            Use my location
          </button>
        </div>
      </label>

      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Placing order...' : 'Place order'}
        </button>
      </div>
    </form>
  );
}
