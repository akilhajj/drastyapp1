import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ─────────────────────────────────────────────────────────────────────────────
// COST-OPTIMIZED AI TUTOR EDGE FUNCTION
// Ultra-budget friendly configuration for OpenRouter API calls
// ─────────────────────────────────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// API Keys
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

// ─── COST CONTROL: Ultra-low cost model priority ─────────────────────────────
// Priority: Free tier > Ultra-cheap > Standard
const COST_OPTIMIZED_MODELS = [
  "meta-llama/llama-3-8b-instruct:free",     // FREE - Primary choice
  "google/gemini-flash-1.5-8b",               // Ultra cheap backup
  "qwen/qwen-2-7b-instruct:free",            // FREE alternative
  "openrouter/auto",                          // Fallback automatic
];

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const REFERER = "https://drastyapp.edu";
const APP_TITLE = "DrastyApp - Cost-Optimized AI Tutor";

// ─── COST CONTROL: Hard token limits ────────────────────────────────────────
const MAX_TOKENS = 250;        // Strict limit for responses
const MAX_CONTEXT_MESSAGES = 4; // Sliding window: only last 4 messages

// ─── COMPASSIONATE TUTOR SYSTEM PROMPT (Brief for token savings) ─────────────
function tutorSystemPrompt(language: string): string {
  if (language === "ar") {
    return `أنت معلم خصوصي حنون ومشجع. قاعدتك الذهبية:

1. أبداً لا تقل "خطأ" أو "إجابة خاطئة". قل: "محاولة رائعة يا قمر! لننظر معاً..."
2. قدم الخيارات (أ، ب، ج، د) عند الشرح.
3. أجب باختصار شديد (أقل من 80 كلمة).

كن صبوراً ومحباً دائماً!`;
  }
  return `You are a compassionate private tutor. Golden rules:

1. NEVER say "wrong" or "incorrect". Say: "Wonderful try, dear! Let's look closer..."
2. Present options (A, B, C, D) when explaining.
3. Keep responses under 80 words to save tokens.

Always be patient and loving!`;
}

// ─── COST CONTROL: Sliding window message builder ─────────────────────────────
function buildOptimizedMessages(
  language: string,
  currentMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Array<{ role: string; content: string }> {
  const systemPrompt = tutorSystemPrompt(language);

  // Apply sliding window: only keep last N messages
  const recentHistory = conversationHistory.slice(-MAX_CONTEXT_MESSAGES);

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
    ...recentHistory,
    { role: "user", content: currentMessage },
  ];

  return messages;
}

// ─── COST CONTROL: Token counter (approximate) ────────────────────────────────
function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for English, ~2 for Arabic
  return Math.ceil(text.length / 3);
}

// ─── COST CONTROL: OpenRouter API caller with retry and fallback ──────────────
async function callOpenRouter(
  language: string,
  userMessage: string,
  history: Array<{ role: string; content: string }> = []
): Promise<{ text: string; isError: boolean; tokensUsed: number }> {

  if (!OPENROUTER_API_KEY) {
    return {
      text: language === "ar"
        ? "خدمة الذكاء الاصطناعي غير متوفرة حالياً."
        : "AI service temporarily unavailable.",
      isError: true,
      tokensUsed: 0,
    };
  }

  const messages = buildOptimizedMessages(language, userMessage, history);
  const inputTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);

  // Try models in order of cost efficiency
  for (const model of COST_OPTIMIZED_MODELS) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": REFERER,
          "X-Title": APP_TITLE,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: MAX_TOKENS,
          temperature: 0.7,
          top_p: 0.9,
          // Cost control: stop on excessive length
          stop: language === "ar" ? ["\n\n\n", "##"] : ["\n\n\n", "##"],
        }),
      });

      if (!res.ok) {
        console.error(`Model ${model} failed:`, res.status);
        continue; // Try next model
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        const outputTokens = estimateTokens(content);
        console.log(`[COST] Model: ${model} | Input: ~${inputTokens} | Output: ~${outputTokens}`);
        return {
          text: content.trim(),
          isError: false,
          tokensUsed: inputTokens + outputTokens,
        };
      }
    } catch (err) {
      console.error(`Model ${model} error:`, err);
      continue;
    }
  }

  // All models failed
  return {
    text: language === "ar"
      ? "عذراً، حدث خطأ. حاول مرة أخرى."
      : "Sorry, an error occurred. Please try again.",
    isError: true,
    tokensUsed: 0,
  };
}

// ─── Voice transcription using OpenAI Whisper ─────────────────────────────────
async function transcribeAudio(audioFile: File, language: string): Promise<string | null> {
  if (!OPENAI_API_KEY) return null;

  try {
    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, "recording.webm");
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", language === "ar" ? "ar" : "en");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}` },
      body: whisperForm,
    });

    if (res.ok) {
      const { text } = await res.json();
      return text;
    }
  } catch (err) {
    console.error("Whisper error:", err);
  }
  return null;
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const contentType = req.headers.get("content-type") || "";

  try {
    // ─── VOICE MODE: multipart/form-data ────────────────────────────────────
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const audio = form.get("audio") as File;
      const language = (form.get("language") as string) || "ar";

      if (!audio) {
        return new Response(
          JSON.stringify({ error: "No audio file" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Transcribe
      const transcribed = await transcribeAudio(audio, language);

      if (!transcribed) {
        return new Response(
          JSON.stringify({
            response: language === "ar"
              ? "لم أفهم التسجيل. حاول مرة أخرى يا قمر!"
              : "Couldn't understand recording. Please try again, dear!",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get AI response (no history for voice - cost control)
      const result = await callOpenRouter(language, transcribed);

      return new Response(
        JSON.stringify({
          response: result.text,
          transcription: transcribed,
          tokensUsed: result.tokensUsed,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── TEXT MODE: JSON body ────────────────────────────────────────────────
    const body = await req.json();
    const { message, language = "ar", history = [] } = body;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "No message provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ⚠️ COST CONTROL: Filter out any image data from history
    // Images should NEVER be sent to OpenRouter API
    const sanitizedHistory = history.map((msg: any) => ({
      role: msg.role,
      content: typeof msg.content === "string"
        ? msg.content.slice(0, 500) // Limit message length
        : "[media]", // Replace non-text content
    }));

    const result = await callOpenRouter(language, message, sanitizedHistory);

    return new Response(
      JSON.stringify({
        response: result.text,
        tokensUsed: result.tokensUsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
