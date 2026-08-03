import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

/**
 * Placeholder order endpoint for the customer ordering SPA.
 * Simulates a local web server receiving the order and returning an Order ID.
 */
export const Route = createFileRoute("/api/public/orders")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const payload = await request.json().catch(() => null);
        if (!payload || typeof payload !== "object") {
          return new Response(JSON.stringify({ success: false, error: "invalid body" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
        return new Response(JSON.stringify({ success: true, orderId }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      },
    },
  },
});
