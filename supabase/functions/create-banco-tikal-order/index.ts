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

    console.log("Creating Banco Tikal order for user:", user.id);
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

    // Return order ID for the checkout page
    return new Response(JSON.stringify({ 
      ordenId: orderData.id,
      totalAmount: totalAmount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Banco Tikal order creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
