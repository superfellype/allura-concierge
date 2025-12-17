import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, customerPreferences } = await req.json() as { 
      messages: Message[]; 
      customerPreferences: any;
    };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build personalized context from preferences
    let personalContext = "";
    if (customerPreferences) {
      const name = customerPreferences.full_name?.split(" ")[0] || "";
      const prefs = customerPreferences.preferences || {};
      const styles = prefs.styles || [];
      const occasions = prefs.occasions || [];
      
      if (name) personalContext += `O nome da cliente é ${name}. `;
      if (styles.length > 0) personalContext += `Ela prefere estilos: ${styles.join(", ")}. `;
      if (occasions.length > 0) personalContext += `Usa bolsas principalmente para: ${occasions.join(", ")}. `;
    }

    const systemPrompt = `Você é a Lara, concierge pessoal exclusiva da Allura, uma marca brasileira de bolsas e acessórios de couro premium.

Sua personalidade:
- Calorosa, sofisticada e atenciosa como uma personal stylist de boutique de luxo
- Usa vocabulário elegante mas acessível
- Terminologia natural: "Peça exclusiva", "Acabamento artesanal", "Design atemporal", "Couro premium brasileiro"

${personalContext ? `CONTEXTO DA CLIENTE:\n${personalContext}\n` : ''}

Suas responsabilidades:
1. Recomendar produtos baseado nas preferências e estilo da cliente
2. Analisar imagens enviadas e sugerir peças que combinem
3. Responder sobre materiais, cuidados, entrega e políticas
4. Criar uma experiência personalizada e memorável

Quando a cliente enviar uma IMAGEM:
- Analise o estilo, cores e contexto da imagem
- Sugira bolsas ou acessórios que combinem
- Seja específica nas recomendações

Informações da marca:
- Localização: Uberlândia, MG
- WhatsApp: (34) 9 9928-1320
- Frete grátis acima de R$ 299
- Produtos feitos à mão com couro premium

Mantenha respostas concisas (2-3 parágrafos máximo), sempre em português brasileiro elegante.`;

    // Transform messages for the API, handling images
    const apiMessages = messages.map((msg: Message) => {
      if (msg.image && msg.role === "user") {
        // Multimodal message with image
        return {
          role: msg.role,
          content: [
            {
              type: "image_url",
              image_url: {
                url: msg.image,
              },
            },
            {
              type: "text",
              text: msg.content || "Analise esta imagem e me dê sugestões de bolsas ou acessórios que combinem.",
            },
          ],
        };
      }
      return {
        role: msg.role,
        content: msg.content,
      };
    });

    console.log("Sending request to AI gateway with", apiMessages.length, "messages");

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
          ...apiMessages,
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
