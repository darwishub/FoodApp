import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const prompt = `Analyze this food image and provide detailed nutritional information in the following JSON format. Be as accurate as possible based on typical values for this food. Return ONLY valid JSON with no markdown or extra text.

{
  "foodName": "Name of the food",
  "servingSize": "e.g. 1 cup (240g)",
  "servingsPerContainer": "e.g. About 2",
  "calories": 250,
  "totalFat": { "amount": "12g", "dailyValue": 15 },
  "saturatedFat": { "amount": "3g", "dailyValue": 15 },
  "transFat": { "amount": "0g" },
  "cholesterol": { "amount": "30mg", "dailyValue": 10 },
  "sodium": { "amount": "470mg", "dailyValue": 20 },
  "totalCarbohydrate": { "amount": "31g", "dailyValue": 11 },
  "dietaryFiber": { "amount": "0g", "dailyValue": 0 },
  "totalSugars": { "amount": "5g" },
  "addedSugars": { "amount": "0g", "dailyValue": 0 },
  "protein": { "amount": "5g" },
  "vitaminD": { "amount": "2mcg", "dailyValue": 10 },
  "calcium": { "amount": "260mg", "dailyValue": 20 },
  "iron": { "amount": "8mg", "dailyValue": 45 },
  "potassium": { "amount": "235mg", "dailyValue": 6 }
}`;

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
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${image}`,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `OpenRouter error: ${error}` }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Strip any markdown code fences if present
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let nutrition;
    try {
      nutrition = JSON.parse(cleaned);
    } catch {
      // AI returned a refusal or non-JSON — not a food image
      return NextResponse.json(
        { error: "That doesn't look like a food image. Please upload a clear photo of a meal, snack, or ingredient and I'll analyze it for you!" }
      );
    }

    return NextResponse.json({ nutrition });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
