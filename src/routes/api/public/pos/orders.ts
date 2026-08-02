import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-pos-token",
  "Access-Control-Max-Age": "86400",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function authorized(request: Request) {
  const expected = process.env["POS_ACCESS_TOKEN"];
  if (!expected) return false;
  const got = request.headers.get("x-pos-token") ?? "";
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "seen", "accepted", "completed", "rejected"]),
});

export const Route = createFileRoute("/api/public/pos/orders")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      // Android POS polls this to fetch incoming web orders.
      GET: async ({ request }) => {
        if (!authorized(request)) return json({ error: "unauthorized" }, 401);

        const url = new URL(request.url);
        const status = url.searchParams.get("status") ?? "new";
        const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 100);
        const since = url.searchParams.get("since");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let query = supabaseAdmin
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (status !== "all") query = query.eq("status", status);
        if (since) query = query.gt("created_at", since);

        const { data, error } = await query;
        if (error) return json({ error: error.message }, 500);
        return json({ orders: data ?? [] });
      },

      // Android POS marks an order as seen / accepted / completed / rejected.
      POST: async ({ request }) => {
        if (!authorized(request)) return json({ error: "unauthorized" }, 401);

        const parsed = updateSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ error: "invalid body" }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("orders")
          .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
          .eq("id", parsed.data.id);

        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      },
    },
  },
});
