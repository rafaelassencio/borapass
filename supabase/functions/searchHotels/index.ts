/**
 * Edge Function: searchHotels
 * Responsável por pesquisar hospedagens e hotéis consumindo a GeckoAPI (https://geckoapi.com.br/docs/)
 * Target: hospedagens / booking.com
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";

export type HotelSearchRequest = {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  rooms?: number;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  const startTime = Date.now();
  console.log(`[searchHotels] Requisição iniciada em ${new Date().toISOString()}`);

  try {
    const body: HotelSearchRequest = await req.json();
    const { destination, checkIn, checkOut, adults = 2, children = 0, rooms = 1 } = body;

    if (!destination || !checkIn || !checkOut) {
      return new Response(
        JSON.stringify({
          error: "Parâmetros 'destination', 'checkIn' e 'checkOut' são obrigatórios.",
          statusCode: 400,
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const geckoKey = Deno.env.get("GECKO_API_KEY");
    const geckoUrl = "https://api.geckoapi.com.br/v1/extract";

    let hotels: any[] = [];
    let isMockFallback = false;

    if (geckoKey) {
      try {
        console.log(`[searchHotels] Invocando GeckoAPI /v1/extract para destino=${destination}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000);

        const apiRes = await fetch(geckoUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${geckoKey}`,
            "Content-Type": "application/json",
            "x-api-key": geckoKey,
          },
          body: JSON.stringify({
            target: "booking.com",
            type: "plp",
            destination,
            checkIn,
            checkOut,
            adults,
            children,
            rooms,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (apiRes.ok) {
          const data = await apiRes.json();
          const items = data.data?.hotels || data.data?.items || data.items || [];
          if (Array.isArray(items) && items.length > 0) {
            hotels = items;
          } else {
            isMockFallback = true;
          }
        } else {
          isMockFallback = true;
        }
      } catch (err: any) {
        console.error(`[searchHotels Exception] ${err.message}`);
        isMockFallback = true;
      }
    } else {
      isMockFallback = true;
    }

    const elapsed = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        source: isMockFallback ? "GeckoAPI Hotels Sandbox" : "GeckoAPI Hotels Live",
        searchParams: { destination, checkIn, checkOut, adults, children, rooms },
        total: hotels.length,
        results: hotels,
        elapsedTimeMs: elapsed,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: "Erro interno ao pesquisar hospedagens na GeckoAPI.",
        details: err.message,
        statusCode: 500,
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
