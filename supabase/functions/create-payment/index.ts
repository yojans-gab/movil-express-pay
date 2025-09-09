import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Get request body with cart items and order details
    const { cartItems, orderDetails } = await req.json();
    
    if (!cartItems || !cartItems.length) {
      throw new Error("No cart items provided");
    }

    // Calculate total amount
    const totalAmount = cartItems.reduce((total: number, item: any) => 
      total + (item.producto.precio * item.cantidad), 0);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create line items for Stripe
    const lineItems = cartItems.map((item: any) => ({
      price_data: {
        currency: "gtq",
        product_data: { 
          name: `${item.producto.marca} ${item.producto.nombre}`,
          description: item.producto.descripcion || undefined,
        },
        unit_amount: Math.round(item.producto.precio * 100), // Convert to cents
      },
      quantity: item.cantidad,
    }));

    // Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/carrito`,
      metadata: {
        user_id: user.id,
        total_amount: totalAmount.toString(),
      },
    });

    // Create order in database using service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: orderData, error: orderError } = await supabaseService
      .from("ordenes")
      .insert({
        usuario_id: user.id,
        total: totalAmount,
        telefono: orderDetails?.telefono || "",
        direccion_envio: orderDetails?.direccion || "",
        estado: "PENDING",
      })
      .select()
      .single();

    if (orderError) throw new Error(`Error creating order: ${orderError.message}`);

    // Create order items
    const orderItems = cartItems.map((item: any) => ({
      orden_id: orderData.id,
      producto_id: item.producto.id,
      cantidad: item.cantidad,
      precio_unitario: item.producto.precio,
      subtotal: item.producto.precio * item.cantidad,
    }));

    const { error: itemsError } = await supabaseService
      .from("orden_items")
      .insert(orderItems);

    if (itemsError) throw new Error(`Error creating order items: ${itemsError.message}`);

    return new Response(JSON.stringify({ 
      url: session.url,
      order_id: orderData.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});