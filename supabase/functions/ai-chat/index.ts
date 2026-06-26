import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "meta-llama/llama-3-8b-instruct:free";
const REFERER = "https://localhost:3000";
const APP_TITLE = "BoltApp";

function systemPrompt(language: string): string {
  return language === "ar"
    ? "أنت مساعد تعليمي ذكي متخصص في المنهج السوري. أجب بشكل واضح ومبسط باللغة العربية."
    : "You are a smart educational assistant for the Syrian curriculum. Answer clearly in English.";
}

function buildBody(language: string, userMessage: string): string {
  return JSON.stringify({
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: systemPrompt(language) },
      { role: "user", content: userMessage },
    ],
    max_tokens: 600,
    temperature: 0.7,
  });
}

async function fetchOpenRouter(language: string, userMessage: string): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": REFERER,
      "X-Title": APP_TITLE,
    },
    body: buildBody(language, userMessage),
  });

  const rawText = await res.text();
  console.log("OpenRouter raw response:", rawText.slice(0, 800));

  if (!res.ok) {
    console.error("OpenRouter HTTP", res.status, rawText);
    return language === "ar"
      ? "عذراً، لم أتمكن من معالجة سؤالك. يرجى المحاولة مرة أخرى."
      : "Sorry, I couldn't process your question. Please try again.";
  }

  try {
    const data = JSON.parse(rawText);
    return data.choices?.[0]?.message?.content || rawText;
  } catch {
    return rawText;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const contentType = req.headers.get("content-type") || "";

  try {
    // ── Voice mode: multipart/form-data ──────────────────────────────────────
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const audio = form.get("audio") as File;
      const language = (form.get("language") as string) || "ar";

      if (!audio) {
        return new Response(
          JSON.stringify({ error: "No audio file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. Transcribe with Whisper (OpenAI — OpenRouter has no audio API)
      let transcribed = "";
      if (OPENAI_API_KEY) {
        const whisperForm = new FormData();
        whisperForm.append("file", audio, "recording.webm");
        whisperForm.append("model", "whisper-1");
        whisperForm.append("language", language === "ar" ? "ar" : "en");

        const wRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: whisperForm,
        });

        if (wRes.ok) {
          const { text } = await wRes.json();
          transcribed = text;
        } else {
          console.error("Whisper error:", await wRes.text());
        }
      }

      if (!transcribed) {
        return new Response(
          JSON.stringify({
            response: language === "ar"
              ? "لم أتمكن من فهم التسجيل. تأكد من إضافة مفتاح OpenAI API لتمكين معالجة الصوت."
              : "I couldn't understand the recording. Make sure your OpenAI API key is set to enable audio processing.",
            audio: null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. AI response via OpenRouter
      const aiText = await fetchOpenRouter(language, transcribed);

      // 3. TTS via OpenAI (OpenRouter has no speech API)
      let audioBase64: string | null = null;
      if (OPENAI_API_KEY) {
        const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1",
            input: aiText,
            voice: language === "ar" ? "onyx" : "nova",
            response_format: "mp3",
          }),
        });

        if (ttsRes.ok) {
          const buf = await ttsRes.arrayBuffer();
          const u8 = new Uint8Array(buf);
          let binary = "";
          for (let i = 0; i < u8.byteLength; i++) binary += String.fromCharCode(u8[i]);
          audioBase64 = btoa(binary);
        } else {
          console.error("TTS error:", await ttsRes.text());
        }
      }

      return new Response(
        JSON.stringify({ response: aiText, transcription: transcribed, audio: audioBase64 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Text mode: JSON body ─────────────────────────────────────────────────
    const body = await req.json();
    const { message, language = "ar" } = body;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "No message provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetchOpenRouter(language, message);

    return new Response(
      JSON.stringify({ response }),
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
