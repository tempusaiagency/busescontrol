import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ChatMessage {
  role: string;
  content: string;
}

interface RequestBody {
  message: string;
  conversation_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY no está configurado');
    }

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { message, conversation_id }: RequestBody = await req.json();

    let conversationId = conversation_id;

    if (!conversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from('chat_conversations')
        .insert({ user_id: user.id, title: message.substring(0, 50) })
        .select()
        .single();

      if (convError) throw convError;
      conversationId = newConversation.id;
    }

    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
      });

    const { data: systemStats, error: statsError } = await supabase
      .rpc('get_system_stats');

    let systemData = '';
    if (!statsError && systemStats) {
      systemData = `\n\nDATOS DEL SISTEMA EN TIEMPO REAL:\n${JSON.stringify(systemStats, null, 2)}`;
    }

    const systemPrompt = `Eres un asistente inteligente para BusControl, un sistema de gestión de empresas de transporte en Paraguay. 

Tu objetivo es ayudar a los usuarios con:
1. Análisis de datos operacionales (viajes, pasajeros, ingresos)
2. Gestión de flota (buses, mantenimiento, seguimiento)
3. Recursos humanos (empleados, conductores)
4. Finanzas (gastos, pronósticos, costos)
5. Inventario y suministros
6. Predicciones y analítica con IA

Cuando respondas:
- Usa los datos en tiempo real proporcionados cuando sean relevantes
- Sé específico con números y métricas cuando estén disponibles
- Proporciona recomendaciones accionables
- Usa formato Markdown para mejor legibilidad
- Responde en español
- Usa el formato de moneda Guaraníes (Gs.) para valores monetarios
- Si no tienes datos suficientes, menciona qué información adicional necesitarías
${systemData}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message },
    ];

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const aiResponse = await openaiResponse.json();
    const assistantMessage = aiResponse.choices[0].message.content;

    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage,
        metadata: { model: 'gpt-4o-mini', tokens: aiResponse.usage },
      });

    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        conversation_id: conversationId,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Error interno del servidor',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});