import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Use service role to bypass RLS for order creation
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");
    logStep("Session ID received", { sessionId: session_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'line_items.data.price.product']
    });

    logStep("Session retrieved", { 
      sessionId: session.id, 
      paymentStatus: session.payment_status,
      userId: session.metadata?.user_id 
    });

    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if order already exists
    const { data: existingOrder } = await supabaseClient
      .from('orders')
      .select('id')
      .eq('stripe_session_id', session_id)
      .single();

    if (existingOrder) {
      logStep("Order already exists", { orderId: existingOrder.id });
      return new Response(JSON.stringify({ 
        order_id: existingOrder.id,
        message: "Order already processed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create order in database
    const orderData = {
      user_id: session.metadata?.user_id,
      status: 'confirmed',
      total_amount: (session.amount_total || 0) / 100, // Convert from centavos
      stripe_session_id: session_id,
      shipping_address: {
        name: session.shipping_details?.name || session.customer_details?.name || '',
        street: session.shipping_details?.address?.line1 || '',
        city: session.shipping_details?.address?.city || '',
        state: session.shipping_details?.address?.state || '',
        zip_code: session.shipping_details?.address?.postal_code || '',
        phone: session.customer_details?.phone || '',
      }
    };

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) throw orderError;
    logStep("Order created", { orderId: order.id });

    // Create order items
    if (session.line_items?.data) {
      const orderItems = session.line_items.data.map((item: any) => ({
        order_id: order.id,
        product_id: item.price.product.metadata?.product_id || 'unknown',
        product_name: item.price.product.name,
        product_image: item.price.product.images?.[0] || '',
        quantity: item.quantity,
        unit_price: (item.price.unit_amount || 0) / 100,
        total_price: ((item.price.unit_amount || 0) * item.quantity) / 100,
      }));

      const { error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;
      logStep("Order items created", { itemCount: orderItems.length });
    }

    // Clear user's cart
    if (session.metadata?.user_id) {
      await supabaseClient
        .from('cart_items')
        .delete()
        .eq('user_id', session.metadata.user_id);
      logStep("Cart cleared for user", { userId: session.metadata.user_id });
    }

    return new Response(JSON.stringify({ 
      order_id: order.id,
      message: "Payment verified and order created successfully" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});