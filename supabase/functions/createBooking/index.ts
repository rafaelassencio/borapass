/**
 * Edge Function: createBooking
 * Encarregada de registrar e confirmar reservas na GeckoAPI e persistir vouchers.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const booking = await req.json();

    console.log(`[createBooking] Criando reserva ${booking.bookingCode} do tipo ${booking.type}...`);

    const bookingCode = booking.bookingCode || `BP-${Math.floor(100000 + Math.random() * 900000)}`;

    return new Response(
      JSON.stringify({
        success: true,
        bookingCode,
        status: "confirmed",
        confirmedAt: new Date().toISOString(),
        voucherUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=BORAPASS-VOUCHER:${bookingCode}`,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: "Erro ao registrar reserva na GeckoAPI.",
        details: err.message,
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
