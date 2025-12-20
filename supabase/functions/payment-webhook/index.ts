import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

interface PaymentEvent {
  type: string;
  data: {
    object: {
      id: string;
      metadata?: {
        order_id?: string;
      };
      payment_intent?: string;
      amount_total?: number;
      status?: string;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // Detect payment provider based on payload structure
    let orderId: string | null = null;
    let paymentStatus: string | null = null;
    let providerReference: string | null = null;
    let eventType: string = "unknown";

    // Stripe webhook format
    if (body.type && body.data?.object) {
      const event = body as PaymentEvent;
      eventType = event.type;
      
      if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
        orderId = event.data.object.metadata?.order_id || null;
        providerReference = event.data.object.id;
        paymentStatus = "paid";
        console.log("Stripe payment completed for order:", orderId);
      } else if (event.type === "payment_intent.payment_failed") {
        orderId = event.data.object.metadata?.order_id || null;
        providerReference = event.data.object.id;
        paymentStatus = "failed";
        console.log("Stripe payment failed for order:", orderId);
      }
    }
    
    // Mercado Pago webhook format
    if (body.action && body.data?.id) {
      eventType = body.action;
      
      if (body.action === "payment.updated" || body.action === "payment.created") {
        providerReference = body.data.id;
        // Mercado Pago requires an API call to get full payment details
        // For now, we'll look for the order by payment reference
        console.log("Mercado Pago payment event:", body.action);
        
        // Try to find payment by provider reference
        const { data: payment } = await supabase
          .from("payments")
          .select("order_id, status")
          .eq("provider_reference", String(providerReference))
          .single();
        
        if (payment) {
          orderId = payment.order_id;
          paymentStatus = body.data.status === "approved" ? "paid" : "pending";
        }
      }
    }

    // InfinitePay webhook format
    if (body.event_type && body.order_id) {
      eventType = body.event_type;
      orderId = body.order_id;
      providerReference = body.payment_id || body.transaction_id;
      
      if (body.event_type === "payment.confirmed" || body.event_type === "payment.approved") {
        paymentStatus = "paid";
        console.log("InfinitePay payment confirmed for order:", orderId);
      } else if (body.event_type === "payment.failed" || body.event_type === "payment.rejected") {
        paymentStatus = "failed";
        console.log("InfinitePay payment failed for order:", orderId);
      }
    }

    // If we have a valid order update
    if (orderId && paymentStatus) {
      // Update order status
      const newOrderStatus = paymentStatus === "paid" ? "paid" : 
                             paymentStatus === "failed" ? "pending_payment" : "created";
      
      const { error: orderError } = await supabase
        .from("orders")
        .update({ 
          status: newOrderStatus,
          payment_id: providerReference 
        })
        .eq("id", orderId);

      if (orderError) {
        console.error("Error updating order:", orderError);
        throw new Error(`Failed to update order: ${orderError.message}`);
      }

      // Update payment record if exists
      const { error: paymentError } = await supabase
        .from("payments")
        .update({ 
          status: paymentStatus,
          provider_reference: providerReference 
        })
        .eq("order_id", orderId);

      if (paymentError) {
        console.error("Error updating payment:", paymentError);
      }

      // Log the event
      const { error: logError } = await supabase
        .from("events_log")
        .insert({
          event_type: "PAYMENT_WEBHOOK_RECEIVED",
          entity_type: "payment",
          entity_id: orderId,
          old_state: null,
          new_state: paymentStatus,
          payload: { 
            provider_reference: providerReference,
            webhook_type: eventType,
            raw_event: body 
          }
        });

      if (logError) {
        console.error("Error logging event:", logError);
      }

      console.log(`Order ${orderId} updated to status: ${newOrderStatus}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          order_id: orderId, 
          status: newOrderStatus 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log unhandled webhook
    console.log("Webhook received but no action taken:", eventType);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Webhook received but no order update required" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
