import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are NutriBot, a caring and honest nutrition coach. The user may upload one or more food images during a conversation. You have full access to the entire chat history including all previously uploaded foods and everything discussed.

Rules you must follow:
1. You CAN and SHOULD answer questions about: food, nutrition, ingredients, health, diet, the current food, any previously uploaded food in this conversation, or what was discussed earlier. If the user asks "what did we talk about?" or "what was my previous food?", look back through the conversation history and answer accurately.
2. ONLY refuse if the topic is completely unrelated to food, health, or nutrition (e.g. weather, coding, sports scores, news). In that case respond with: "I'm only able to help with food and nutrition questions! 🥗 Is there something about this food you'd like to know?"
3. Keep every response SHORT — 2 to 4 sentences max. Be warm but honest. Never sugarcoat health risks just to be polite.
4. When a user mentions their body weight, health condition, or fitness goal, factor it into your advice genuinely. If the food is not ideal for their situation, say so kindly but clearly and suggest a smarter alternative.
5. Always steer users toward healthier habits. Your goal is long-term health, not short-term comfort.
6. End EVERY response with one short, practical follow-up question about portion, frequency, substitution, or their health goal.
7. Never use bullet lists or headers — plain conversational sentences only.
8. If uncertain about exact values, give a helpful estimate and say so briefly.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Food Nutrition Analyzer",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 500,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `OpenRouter error: ${error}` }, { status: 500 });
    }

    // Transform OpenRouter SSE stream → plain text chunks
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const raw = decoder.decode(value, { stream: true });
            for (const line of raw.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) controller.enqueue(encoder.encode(content));
              } catch {
                // skip malformed SSE chunks
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 }
    );
  }
}
