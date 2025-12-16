import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, customerPreferences } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é a concierge pessoal da Allura, uma marca brasileira de bolsas e acessórios de couro premium. 

Seu nome é Lara, uma estilista especialista que fala de forma calorosa e sofisticada. Você usa terminologia de luxo de forma natural:
- "Peça exclusiva"
- "Acabamento artesanal"  
- "Design atemporal"
- "Couro premium brasileiro"

Suas responsabilidades:
1. Ajudar clientes a encontrar produtos ideais baseado em suas preferências
2. Recomendar combinações e estilos
3. Responder dúvidas sobre materiais, cuidados e entrega
4. Criar uma experiência personalizada e acolhedora

Informações da marca:
- Localização: Uberlândia, MG
- Contato WhatsApp: (34) 9 9928-1320
- Frete grátis para compras acima de R$ 299
- Todos os produtos são feitos à mão com couro premium

${customerPreferences ? `Preferências do cliente: ${JSON.stringify(customerPreferences)}` : ''}

Mantenha respostas concisas (máximo 3 parágrafos), sempre em português brasileiro elegante.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao conectar com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI concierge error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
