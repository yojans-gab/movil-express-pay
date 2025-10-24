import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) throw new Error("User not authenticated");

    const { pagoId, bancoTransactionId } = await req.json();

    if (!pagoId) {
      throw new Error("Payment ID is required");
    }

    console.log("Confirming Banco Tikal payment:", pagoId);

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get payment details
    const { data: pagoData, error: pagoError } = await supabaseService
      .from("pago")
      .select("*, orden:orden_id(usuario_id)")
      .eq("id", pagoId)
      .single();

    if (pagoError || !pagoData) {
      throw new Error("Payment not found");
    }

    // Verify the payment belongs to the authenticated user
    if (pagoData.orden.usuario_id !== user.id) {
      throw new Error("Unauthorized");
    }

    // Update payment status to APROBADO
    const { error: updateError } = await supabaseService
      .from("pago")
      .update({
        estado: "APROBADO",
        banco_pago_id: bancoTransactionId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pagoId);

    if (updateError) {
      console.error("Error updating payment:", updateError);
      throw new Error(`Error al actualizar el pago: ${updateError.message}`);
    }

    console.log("Payment confirmed successfully");

    // The trigger will handle stock adjustment automatically
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Payment confirmed successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
