import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    // Get request body with cart items and order details
    const { cartItems, orderDetails, totalAmount } = await req.json();
    
    if (!cartItems || !cartItems.length) {
      throw new Error("No cart items provided");
    }

    console.log("Creating Banco Kabzin order for user:", user.id);
    console.log("Total amount:", totalAmount);

    // Create order in database using service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: orderData, error: orderError } = await supabaseService
      .from("orden")
      .insert({
        usuario_id: user.id,
        total: totalAmount,
        telefono: orderDetails?.telefono || "",
        direccion_envio: orderDetails?.direccion_envio || "",
        estado: "PENDING",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw new Error(`Error al crear la orden: ${orderError.message}`);
    }

    console.log("Order created:", orderData.id);

    // Create order items
    const orderItems = cartItems.map((item: any) => ({
      orden_id: orderData.id,
      producto_id: item.producto.id,
      cantidad: item.cantidad,
      precio_unitario: item.producto.precio,
      subtotal: item.producto.precio * item.cantidad,
    }));

    const { error: itemsError } = await supabaseService
      .from("orden_item")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);
      throw new Error(`Error al crear los artículos de la orden: ${itemsError.message}`);
    }

    console.log("Order items created successfully");

    // Get comercio info (assuming first comercio for now)
    const { data: comercioData, error: comercioError } = await supabaseService
      .from("comercio")
      .select("*")
      .limit(1)
      .single();

    if (comercioError || !comercioData) {
      console.error("Comercio not found:", comercioError);
      throw new Error("Comercio no encontrado");
    }

    // Generate idempotency key for BATZIR
    const idempotencyKey = `ord-${orderData.id}`;

    // Create payment record
    const { data: pagoData, error: pagoError } = await supabaseService
      .from("pago")
      .insert({
        orden_id: orderData.id,
        comercio_id: comercioData.id,
        monto: totalAmount,
        estado: "PENDING",
        idempotency_key: idempotencyKey,
      })
      .select()
      .single();

    if (pagoError) {
      console.error("Payment creation error:", pagoError);
      throw new Error(`Error al crear el pago: ${pagoError.message}`);
    }

    console.log("Payment record created:", pagoData.id);

    // Call BATZIR API to create checkout session
    const GATEWAY_BASE_URL = Deno.env.get("BATZIR_GATEWAY_BASE_URL");
    const GATEWAY_API_KEY = Deno.env.get("BATZIR_GATEWAY_API_KEY");

    if (!GATEWAY_BASE_URL || !GATEWAY_API_KEY) {
      throw new Error("BATZIR credentials not configured");
    }

    const appUrl = req.headers.get("origin") || "https://9d13ea5c-2e0a-49a0-961c-dd81d92474e6.lovableproject.com";
    
    const batzirResponse = await fetch(`${GATEWAY_BASE_URL}/v1/checkout/sessions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GATEWAY_API_KEY}`,
        "Idempotency-Key": idempotencyKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        order_id: orderData.id,
        amount: totalAmount,
        currency: "GTQ",
        success_url: `${appUrl}/payment-success?orden=${orderData.id}`,
        cancel_url: `${appUrl}/payment-cancel?orden=${orderData.id}`
      })
    });

    const batzirText = await batzirResponse.text();
    
    if (!batzirResponse.ok) {
      console.error("BATZIR API error:", batzirResponse.status, batzirText);
      throw new Error(`Error al crear sesión de pago con BATZIR: ${batzirText}`);
    }

    const batzirData = JSON.parse(batzirText);
    console.log("BATZIR checkout session created:", batzirData);

    // Update payment with BATZIR reference
    if (batzirData.session_id) {
      await supabaseService
        .from("pago")
        .update({ banco_pago_id: batzirData.session_id })
        .eq("id", pagoData.id);
    }

    // Return checkout URL for redirect
    return new Response(JSON.stringify({ 
      ordenId: orderData.id,
      totalAmount: totalAmount,
      checkoutUrl: batzirData.checkout_url
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Banco Kabzin order creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
