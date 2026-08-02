CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  qr_title text,
  qr_message text,
  customer_name text,
  customer_phone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  note text,
  status text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'web',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_status_created_idx ON public.orders (status, created_at DESC);

GRANT INSERT ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can place an order"
ON public.orders FOR INSERT TO anon, authenticated
WITH CHECK (status = 'new' AND source = 'web');